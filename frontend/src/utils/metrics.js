const defaultLoader = () => import(/* @vite-ignore */ 'prom-client');

const HTTP_BUCKETS = [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30];
const DEPENDENCY_BUCKETS = HTTP_BUCKETS;
const DCHAT_BUCKETS = HTTP_BUCKETS;

const OUTCOMES = new Set([
    'success',
    'timeout',
    'rate_limited',
    'validation_error',
    'malformed_response',
    'dependency_failure',
    'server_error',
    'fallback_used',
    'fallback_unavailable',
    'unknown_error',
]);
const PROVIDERS = new Set(['tokenplace', 'openai', 'none', 'unknown']);
const DEPENDENCIES = new Set(['tokenplace', 'openai']);

let register;
let metricsAvailable = false;
let metricHandles = null;

const globalState = () => {
    const key = '__DSPACE_PROM_METRICS__';
    globalThis[key] ||= {};
    return globalThis[key];
};

const sanitizeEnum = (value, allowed, fallback) =>
    allowed.has(String(value || '').toLowerCase()) ? String(value).toLowerCase() : fallback;

export const normalizeOutcome = (value) => sanitizeEnum(value, OUTCOMES, 'unknown_error');
export const normalizeProvider = (value) => sanitizeEnum(value, PROVIDERS, 'unknown');
export const normalizeDependency = (value) => sanitizeEnum(value, DEPENDENCIES, 'tokenplace');

export const statusClassFor = (status) => {
    const numeric = Number(status);
    if (!Number.isFinite(numeric) || numeric < 100) return 'unknown';
    return `${Math.floor(numeric / 100)}xx`;
};

export const outcomeFromStatus = (status) => {
    const numeric = Number(status);
    if (numeric >= 200 && numeric < 400) return 'success';
    if (numeric === 408) return 'timeout';
    if (numeric === 429) return 'rate_limited';
    if (numeric >= 400 && numeric < 500) return 'validation_error';
    if (numeric >= 500) return 'server_error';
    return 'unknown_error';
};

export const outcomeFromError = (error) => {
    const status = Number(error?.status ?? error?.statusCode ?? error?.response?.status);
    const type = String(
        error?.type ?? error?.code ?? error?.name ?? error?.message ?? ''
    ).toLowerCase();
    if (status === 408 || type.includes('abort') || type.includes('timeout')) return 'timeout';
    if (status === 429 || type.includes('rate')) return 'rate_limited';
    if (type.includes('malformed')) return 'malformed_response';
    if (status >= 400 && status < 500) return 'validation_error';
    if (status >= 500 || type.includes('server')) return 'server_error';
    if (
        type.includes('network') ||
        type.includes('fetch') ||
        type.includes('typeerror') ||
        type.includes('provider')
    ) {
        return 'dependency_failure';
    }
    return 'unknown_error';
};

export const normalizeRoute = (urlOrPath) => {
    let pathname = '/unknown';
    try {
        pathname = new URL(urlOrPath, 'http://dspace.local').pathname;
    } catch {
        pathname = String(urlOrPath || '/unknown').split('?')[0] || '/unknown';
    }
    if (pathname === '/metrics') return '/metrics';
    if (pathname === '/') return '/';
    if (
        [
            '/health',
            '/healthz',
            '/livez',
            '/config.json',
            '/cache-version.js',
            '/service-worker.js',
        ].includes(pathname)
    )
        return pathname;
    if (pathname.startsWith('/_astro/')) return '/_astro/*';
    if (pathname.startsWith('/assets/')) return '/assets/*';
    if (/^\/docs\/[^/]+(?:\/[^/]+)?$/.test(pathname)) return '/docs/[slug]';
    if (/^\/inventory\/item\/[^/]+(?:\/edit)?$/.test(pathname))
        return pathname.endsWith('/edit')
            ? '/inventory/item/[itemId]/edit'
            : '/inventory/item/[itemId]';
    if (/^\/processes\/[^/]+$/.test(pathname)) return '/processes/[processId]';
    if (/^\/quests\/[^/]+\/[^/]+$/.test(pathname)) return '/quests/[pathId]/[questId]';
    return (
        pathname
            .split('/')
            .map((part) => (/^[0-9a-f-]{8,}$/i.test(part) || /^\d+$/.test(part) ? '[id]' : part))
            .join('/') || '/unknown'
    );
};

const getOrCreateMetric = (constructors, registerInstance, type, config) => {
    const existing = registerInstance.getSingleMetric(config.name);
    if (existing) return existing;
    const Ctor = constructors[type] || globalState().constructors?.[type];
    return new Ctor({ ...config, registers: [registerInstance] });
};

const loadBuildInfo = () => ({
    version: process.env.DSPACE_VERSION || process.env.npm_package_version || '3.0.1',
    revision:
        process.env.DSPACE_REVISION ||
        process.env.GITHUB_SHA ||
        process.env.SOURCE_VERSION ||
        'unknown',
});

async function initMetrics(loader = defaultLoader) {
    try {
        const prom = await loader();
        const { Registry, collectDefaultMetrics, Counter, Histogram, Gauge } = prom;
        const state = globalState();
        state.constructors = { Counter, Histogram, Gauge };
        register = state.register || new Registry();
        state.register = register;
        if (!state.defaultMetricsCollected) {
            collectDefaultMetrics({ register });
            state.defaultMetricsCollected = true;
        }
        metricHandles = {
            httpRequests: getOrCreateMetric({ Counter }, register, 'Counter', {
                name: 'dspace_http_requests_total',
                help: 'Total DSPACE HTTP requests by bounded route and outcome labels.',
                labelNames: ['method', 'route', 'status_class', 'outcome'],
            }),
            httpDuration: getOrCreateMetric({ Histogram }, register, 'Histogram', {
                name: 'dspace_http_request_duration_seconds',
                help: 'DSPACE HTTP request duration by bounded route and outcome labels.',
                labelNames: ['method', 'route', 'status_class', 'outcome'],
                buckets: HTTP_BUCKETS,
            }),
            dchatRequests: getOrCreateMetric({ Counter }, register, 'Counter', {
                name: 'dspace_dchat_requests_total',
                help: 'Total dChat requests by provider and bounded outcome.',
                labelNames: ['provider', 'outcome'],
            }),
            dchatDuration: getOrCreateMetric({ Histogram }, register, 'Histogram', {
                name: 'dspace_dchat_request_duration_seconds',
                help: 'dChat request duration by provider and bounded outcome.',
                labelNames: ['provider', 'outcome'],
                buckets: DCHAT_BUCKETS,
            }),
            dependencyRequests: getOrCreateMetric({ Counter }, register, 'Counter', {
                name: 'dspace_dependency_requests_total',
                help: 'Total dependency requests by bounded dependency and outcome.',
                labelNames: ['dependency', 'outcome'],
            }),
            dependencyDuration: getOrCreateMetric({ Histogram }, register, 'Histogram', {
                name: 'dspace_dependency_request_duration_seconds',
                help: 'Dependency request duration by bounded dependency and outcome.',
                labelNames: ['dependency', 'outcome'],
                buckets: DEPENDENCY_BUCKETS,
            }),
            buildInfo: getOrCreateMetric({ Gauge }, register, 'Gauge', {
                name: 'dspace_build_info',
                help: 'DSPACE build metadata with low-cardinality labels.',
                labelNames: ['version', 'revision'],
            }),
            instrumentationUp: getOrCreateMetric({ Gauge }, register, 'Gauge', {
                name: 'dspace_instrumentation_up',
                help: 'Whether DSPACE metrics instrumentation initialized successfully.',
                labelNames: [],
            }),
        };
        const build = loadBuildInfo();
        metricHandles.buildInfo.set(build, 1);
        metricHandles.instrumentationUp.set(1);
        metricsAvailable = true;
    } catch (error) {
        metricsAvailable = false;
        metricHandles = null;
        register = {
            contentType: 'text/plain; charset=utf-8',
            metrics: async () => '# dspace metrics unavailable\n',
            error,
        };
    }
}

await initMetrics();

const secondsSince = (start) => Math.max(0, (performance.now() - start) / 1000);

export const getMetricsStatus = () => ({ available: metricsAvailable, register });

export const recordHttpRequest = ({
    method = 'GET',
    route = '/unknown',
    status = 0,
    outcome,
    durationSeconds = 0,
}) => {
    if (!metricsAvailable || !metricHandles || route === '/metrics') return;
    const labels = {
        method: String(method || 'GET').toUpperCase(),
        route: normalizeRoute(route),
        status_class: statusClassFor(status),
        outcome: normalizeOutcome(outcome || outcomeFromStatus(status)),
    };
    if (labels.route === '/metrics') return;
    metricHandles.httpRequests.inc(labels, 1);
    metricHandles.httpDuration.observe(labels, durationSeconds);
};

export const instrumentHttpRequest = async ({ request, route }, fn) => {
    const start = performance.now();
    try {
        const response = await fn();
        recordHttpRequest({
            method: request?.method,
            route: route || request?.url,
            status: response?.status,
            durationSeconds: secondsSince(start),
        });
        return response;
    } catch (error) {
        recordHttpRequest({
            method: request?.method,
            route: route || request?.url,
            status: 500,
            outcome: 'server_error',
            durationSeconds: secondsSince(start),
        });
        throw error;
    }
};

export const recordDchatRequest = ({
    provider = 'unknown',
    outcome = 'unknown_error',
    durationSeconds = 0,
}) => {
    if (!metricsAvailable || !metricHandles) return;
    const labels = { provider: normalizeProvider(provider), outcome: normalizeOutcome(outcome) };
    metricHandles.dchatRequests.inc(labels, 1);
    metricHandles.dchatDuration.observe(labels, durationSeconds);
};

export const recordDependencyRequest = ({
    dependency = 'tokenplace',
    outcome = 'unknown_error',
    durationSeconds = 0,
}) => {
    if (!metricsAvailable || !metricHandles) return;
    const labels = {
        dependency: normalizeDependency(dependency),
        outcome: normalizeOutcome(outcome),
    };
    metricHandles.dependencyRequests.inc(labels, 1);
    metricHandles.dependencyDuration.observe(labels, durationSeconds);
};

export const instrumentDchatOperation = async (provider, operation) => {
    const normalizedProvider = normalizeProvider(provider);
    const start = performance.now();
    let outcome = 'unknown_error';
    try {
        const result = await operation();
        outcome = result?.metricsOutcome ? normalizeOutcome(result.metricsOutcome) : 'success';
        return result;
    } catch (error) {
        outcome = outcomeFromError(error);
        throw error;
    } finally {
        recordDchatRequest({
            provider: normalizedProvider,
            outcome,
            durationSeconds: secondsSince(start),
        });
    }
};

export const instrumentDependencyOperation = async (dependency, operation) => {
    const normalizedDependency = normalizeDependency(dependency);
    const start = performance.now();
    let outcome = 'unknown_error';
    try {
        const result = await operation();
        outcome = result?.metricsOutcome ? normalizeOutcome(result.metricsOutcome) : 'success';
        return result;
    } catch (error) {
        outcome = outcomeFromError(error);
        throw error;
    } finally {
        recordDependencyRequest({
            dependency: normalizedDependency,
            outcome,
            durationSeconds: secondsSince(start),
        });
    }
};

export { register, initMetrics, OUTCOMES, PROVIDERS, DEPENDENCIES };
