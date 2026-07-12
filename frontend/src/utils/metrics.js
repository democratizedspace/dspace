let promClient;
let register;
let metricsReady = false;
let instrumentationUp;
let httpRequestsTotal;
let httpRequestDurationSeconds;
let dchatRequestsTotal;
let dchatRequestDurationSeconds;
let dependencyRequestsTotal;
let dependencyRequestDurationSeconds;
let buildInfo;

const defaultLoader = () => import(/* @vite-ignore */ 'prom-client');

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
const HTTP_BUCKETS = [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30];
const CHAT_BUCKETS = [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30];

const normalizeEnum = (value, allowed, fallback) => {
    const normalized = String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[-\s]+/g, '_');
    return allowed.has(normalized) ? normalized : fallback;
};

export const normalizeProvider = (provider) => {
    const normalized = String(provider || '')
        .toLowerCase()
        .replace(/[-_\s.]+/g, '');
    if (normalized === 'tokenplace') return 'tokenplace';
    if (normalized === 'openai') return 'openai';
    if (normalized === 'none') return 'none';
    return 'unknown';
};

export const normalizeDependency = (dependency) => {
    const normalized = normalizeProvider(dependency);
    return DEPENDENCIES.has(normalized) ? normalized : 'openai';
};

export const normalizeOutcome = (outcome) => normalizeEnum(outcome, OUTCOMES, 'unknown_error');

export const outcomeFromError = (error) => {
    const status = Number(error?.status || error?.response?.status || 0);
    const type = String(error?.type || error?.code || error?.name || '').toLowerCase();
    const message = String(error?.message || '').toLowerCase();
    if (status === 429 || type.includes('rate_limit') || message.includes('rate limit')) {
        return 'rate_limited';
    }
    if (type.includes('abort') || type.includes('timeout') || message.includes('timeout'))
        return 'timeout';
    if (type.includes('validation') || status === 400 || status === 422) return 'validation_error';
    if (
        type.includes('malformed') ||
        message.includes('malformed') ||
        message.includes('invalid json')
    ) {
        return 'malformed_response';
    }
    if (status >= 500 || type.includes('server')) return 'server_error';
    if (status >= 400 || type.includes('network') || type.includes('provider')) {
        return 'dependency_failure';
    }
    return 'unknown_error';
};

export const statusClass = (status) => {
    const code = Number(status);
    return Number.isFinite(code) && code >= 100 && code < 600
        ? `${Math.floor(code / 100)}xx`
        : 'unknown';
};

export const normalizeRoute = (pathname) => {
    const path = String(pathname || '/').split('?')[0] || '/';
    if (path === '/') return '/';
    if (path === '/metrics') return '/metrics';
    if (path === '/health' || path === '/healthz' || path === '/livez') return path;
    if (path === '/config.json' || path === '/cache-version.js' || path === '/build-meta.json')
        return path;
    if (path.startsWith('/_astro/')) return '/_astro/[asset]';
    if (path.startsWith('/assets/')) return '/assets/[asset]';
    if (path.startsWith('/docs/')) return '/docs/[slug]';
    if (path.startsWith('/inventory/item/')) return '/inventory/item/[itemId]';
    if (path.startsWith('/processes/')) return '/processes/[processId]';
    if (path.startsWith('/quests/')) return '/quests/[pathId]/[questId]';
    return path.replace(/[0-9a-f]{8,}/gi, '[id]').replace(/\/\d+/g, '/[id]');
};

const createMetric = (Metric, config) => new Metric({ registers: [register], ...config });

const revision = () =>
    process.env.VITE_GIT_SHA || process.env.GITHUB_SHA || process.env.GIT_SHA || 'unknown';

async function initMetrics(loader = defaultLoader) {
    try {
        promClient = await loader();
        const { Registry, collectDefaultMetrics, Counter, Histogram, Gauge } = promClient;
        register = new Registry();
        collectDefaultMetrics({ register });
        httpRequestsTotal = createMetric(Counter, {
            name: 'dspace_http_requests_total',
            help: 'Total DSPACE HTTP requests.',
            labelNames: ['method', 'route', 'status_class', 'outcome'],
        });
        httpRequestDurationSeconds = createMetric(Histogram, {
            name: 'dspace_http_request_duration_seconds',
            help: 'DSPACE HTTP request duration in seconds.',
            labelNames: ['method', 'route', 'status_class', 'outcome'],
            buckets: HTTP_BUCKETS,
        });
        dchatRequestsTotal = createMetric(Counter, {
            name: 'dspace_dchat_requests_total',
            help: 'Total dChat logical requests.',
            labelNames: ['provider', 'outcome'],
        });
        dchatRequestDurationSeconds = createMetric(Histogram, {
            name: 'dspace_dchat_request_duration_seconds',
            help: 'dChat logical request duration in seconds.',
            labelNames: ['provider', 'outcome'],
            buckets: CHAT_BUCKETS,
        });
        dependencyRequestsTotal = createMetric(Counter, {
            name: 'dspace_dependency_requests_total',
            help: 'Total outbound dependency requests.',
            labelNames: ['dependency', 'outcome'],
        });
        dependencyRequestDurationSeconds = createMetric(Histogram, {
            name: 'dspace_dependency_request_duration_seconds',
            help: 'Outbound dependency request duration in seconds.',
            labelNames: ['dependency', 'outcome'],
            buckets: CHAT_BUCKETS,
        });
        buildInfo = createMetric(Gauge, {
            name: 'dspace_build_info',
            help: 'DSPACE build information.',
            labelNames: ['version', 'revision'],
        });
        instrumentationUp = createMetric(Gauge, {
            name: 'dspace_instrumentation_up',
            help: 'DSPACE metrics instrumentation initialization status.',
        });
        buildInfo.set(
            { version: process.env.npm_package_version || '3.0.1', revision: revision() },
            1
        );
        instrumentationUp.set(1);
        metricsReady = true;
    } catch (error) {
        metricsReady = false;
        register = {
            contentType: 'text/plain; version=0.0.4; charset=utf-8',
            metrics: async () => {
                throw new Error('metrics unavailable');
            },
        };
    }
}

export const isMetricsReady = () => metricsReady;

export const recordHttpRequest = ({
    method = 'GET',
    route = '/',
    status = 200,
    outcome,
    durationSeconds = 0,
}) => {
    if (!metricsReady || normalizeRoute(route) === '/metrics') return;
    const labels = {
        method: String(method || 'GET').toUpperCase(),
        route: normalizeRoute(route),
        status_class: statusClass(status),
        outcome: normalizeOutcome(outcome || (Number(status) >= 500 ? 'server_error' : 'success')),
    };
    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, Math.max(0, Number(durationSeconds) || 0));
};

export const recordDchatRequest = ({
    provider = 'unknown',
    outcome = 'success',
    durationSeconds = 0,
}) => {
    if (!metricsReady) return;
    const labels = { provider: normalizeProvider(provider), outcome: normalizeOutcome(outcome) };
    dchatRequestsTotal.inc(labels);
    dchatRequestDurationSeconds.observe(labels, Math.max(0, Number(durationSeconds) || 0));
};

export const recordDependencyRequest = ({
    dependency = 'openai',
    outcome = 'success',
    durationSeconds = 0,
}) => {
    if (!metricsReady) return;
    const labels = {
        dependency: normalizeDependency(dependency),
        outcome: normalizeOutcome(outcome),
    };
    dependencyRequestsTotal.inc(labels);
    dependencyRequestDurationSeconds.observe(labels, Math.max(0, Number(durationSeconds) || 0));
};

await initMetrics();

export { register, initMetrics };
