import packageMetadata from '../../../package.json' with { type: 'json' };

let register;
let metricsReady = false;
let metricHandles = {};

const defaultLoader = () => import(/* @vite-ignore */ 'prom-client');

const HTTP_BUCKETS = [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30];
const DEPENDENCY_BUCKETS = HTTP_BUCKETS;

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

const unavailableRegistry = (reason = 'metrics unavailable') => ({
    contentType: 'text/plain',
    unavailable: true,
    reason,
    metrics: async () => `# ${reason}\n`,
});

const getOrCreateMetric = (MetricClass, config) => {
    const existing = register.getSingleMetric?.(config.name);
    if (existing) return existing;
    return new MetricClass({ ...config, registers: [register] });
};

const normalizeEnum = (value, allowed, fallback) => {
    const normalized = String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, '_');
    return allowed.has(normalized) ? normalized : fallback;
};

export const normalizeOutcome = (value) => normalizeEnum(value, OUTCOMES, 'unknown_error');
export const normalizeProvider = (value) => normalizeEnum(value, PROVIDERS, 'unknown');
export const normalizeDependency = (value) => normalizeEnum(value, DEPENDENCIES, 'unknown');

export const statusClassFor = (status) => {
    const numeric = Number(status);
    if (!Number.isFinite(numeric) || numeric < 100) return 'unknown';
    return `${Math.trunc(numeric / 100)}xx`;
};

export const normalizeRoute = (urlOrPath) => {
    let path = '/unknown';
    try {
        path = new URL(urlOrPath, 'http://dspace.local').pathname;
    } catch {
        path = String(urlOrPath || '/unknown').split('?')[0] || '/unknown';
    }

    if (path === '/metrics') return '/metrics';
    if (path === '/' || path === '/health' || path === '/healthz' || path === '/livez') return path;
    if (path === '/config.json' || path === '/service-worker.js' || path === '/cache-version.js') {
        return path;
    }
    if (path.startsWith('/_astro/')) return '/_astro/*';
    if (path.startsWith('/assets/')) return '/assets/*';
    if (path.startsWith('/docs/')) return '/docs/[slug]';
    if (path.startsWith('/inventory/item/')) return '/inventory/item/[itemId]';
    if (path.startsWith('/processes/')) return '/processes/[processId]';
    if (path.startsWith('/quests/')) return '/quests/[pathId]/[questId]';
    return path.replace(/[0-9a-f]{8,}/gi, '[id]').replace(/\d+/g, '[id]');
};

export const outcomeFromError = (error) => {
    const status = Number(error?.status ?? error?.response?.status);
    const code = String(error?.code || error?.type || '').toLowerCase();
    const name = String(error?.name || '').toLowerCase();
    if (
        status === 408 ||
        code.includes('timeout') ||
        name.includes('timeout') ||
        name === 'aborterror'
    ) {
        return 'timeout';
    }
    if (status === 429 || code.includes('rate_limit')) return 'rate_limited';
    if (status >= 500) return 'server_error';
    if (status >= 400) return 'dependency_failure';
    if (code.includes('malformed')) return 'malformed_response';
    return 'unknown_error';
};

const safeObserve = (operation) => {
    try {
        if (metricsReady) operation();
    } catch {
        // Metrics must never break game functionality.
    }
};

export const recordHttpRequest = ({ method, route, status, outcome, durationSeconds }) =>
    safeObserve(() => {
        const labels = {
            method: String(method || 'GET').toUpperCase(),
            route: normalizeRoute(route),
            status_class: statusClassFor(status),
            outcome: normalizeOutcome(outcome),
        };
        if (labels.route === '/metrics') return;
        metricHandles.httpRequests.inc(labels);
        if (Number.isFinite(durationSeconds)) {
            metricHandles.httpDuration.observe(labels, Math.max(0, durationSeconds));
        }
    });

export const recordDchatRequest = ({ provider, outcome, durationSeconds }) =>
    safeObserve(() => {
        const labels = {
            provider: normalizeProvider(provider),
            outcome: normalizeOutcome(outcome),
        };
        metricHandles.dchatRequests.inc(labels);
        if (Number.isFinite(durationSeconds)) {
            metricHandles.dchatDuration.observe(labels, Math.max(0, durationSeconds));
        }
    });

export const recordDependencyRequest = ({ dependency, outcome, durationSeconds }) =>
    safeObserve(() => {
        const labels = {
            dependency: normalizeDependency(dependency),
            outcome: normalizeOutcome(outcome),
        };
        metricHandles.dependencyRequests.inc(labels);
        if (Number.isFinite(durationSeconds)) {
            metricHandles.dependencyDuration.observe(labels, Math.max(0, durationSeconds));
        }
    });

export const withDchatMetrics = async (provider, operation) => {
    const startedAt = performance.now();
    let outcome = 'success';
    try {
        const result = await operation();
        if (result?.metricsOutcome) outcome = result.metricsOutcome;
        return result;
    } catch (error) {
        outcome = outcomeFromError(error);
        throw error;
    } finally {
        recordDchatRequest({
            provider,
            outcome,
            durationSeconds: (performance.now() - startedAt) / 1000,
        });
    }
};

export const withDependencyMetrics = async (dependency, operation) => {
    const startedAt = performance.now();
    let outcome = 'success';
    try {
        const result = await operation();
        if (result?.metricsOutcome) outcome = result.metricsOutcome;
        return result;
    } catch (error) {
        outcome = outcomeFromError(error);
        throw error;
    } finally {
        recordDependencyRequest({
            dependency,
            outcome,
            durationSeconds: (performance.now() - startedAt) / 1000,
        });
    }
};

async function initMetrics(loader = defaultLoader) {
    metricsReady = false;
    metricHandles = {};
    try {
        const { Registry, collectDefaultMetrics, Counter, Histogram, Gauge } = await loader();
        register = new Registry();
        collectDefaultMetrics({ register });
        metricHandles.httpRequests = getOrCreateMetric(Counter, {
            name: 'dspace_http_requests_total',
            help: 'DSPACE HTTP requests by bounded route, status class, and outcome.',
            labelNames: ['method', 'route', 'status_class', 'outcome'],
        });
        metricHandles.httpDuration = getOrCreateMetric(Histogram, {
            name: 'dspace_http_request_duration_seconds',
            help: 'DSPACE HTTP request duration in seconds.',
            labelNames: ['method', 'route', 'status_class', 'outcome'],
            buckets: HTTP_BUCKETS,
        });
        metricHandles.dchatRequests = getOrCreateMetric(Counter, {
            name: 'dspace_dchat_requests_total',
            help: 'DSPACE dChat logical requests by provider and terminal outcome.',
            labelNames: ['provider', 'outcome'],
        });
        metricHandles.dchatDuration = getOrCreateMetric(Histogram, {
            name: 'dspace_dchat_request_duration_seconds',
            help: 'DSPACE dChat logical request duration in seconds.',
            labelNames: ['provider', 'outcome'],
            buckets: HTTP_BUCKETS,
        });
        metricHandles.dependencyRequests = getOrCreateMetric(Counter, {
            name: 'dspace_dependency_requests_total',
            help: 'DSPACE bounded dependency requests by dependency and outcome.',
            labelNames: ['dependency', 'outcome'],
        });
        metricHandles.dependencyDuration = getOrCreateMetric(Histogram, {
            name: 'dspace_dependency_request_duration_seconds',
            help: 'DSPACE bounded dependency request duration in seconds.',
            labelNames: ['dependency', 'outcome'],
            buckets: DEPENDENCY_BUCKETS,
        });
        metricHandles.buildInfo = getOrCreateMetric(Gauge, {
            name: 'dspace_build_info',
            help: 'DSPACE build metadata as one low-cardinality sample.',
            labelNames: ['version', 'revision'],
        });
        metricHandles.instrumentationUp = getOrCreateMetric(Gauge, {
            name: 'dspace_instrumentation_up',
            help: 'Whether DSPACE metrics instrumentation initialized successfully.',
        });
        metricHandles.buildInfo.set(
            {
                version: packageMetadata.version || 'unknown',
                revision: process.env.VITE_GIT_SHA || process.env.GITHUB_SHA || 'missing',
            },
            1
        );
        metricHandles.instrumentationUp.set(1);
        metricsReady = true;
    } catch (error) {
        register = unavailableRegistry('metrics unavailable');
    }
}

await initMetrics();

export { register, initMetrics };
