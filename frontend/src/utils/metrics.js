let client;
let register;
let instrumentationUp;
let initializationError;

const HTTP_BUCKETS = [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30];
const CHAT_BUCKETS = [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60, 120];
export const PROVIDERS = ['tokenplace', 'openai', 'none', 'unknown'];
export const OUTCOMES = [
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
];
export const DEPENDENCIES = ['tokenplace', 'openai'];

const defaultLoader = () => import(/* @vite-ignore */ 'prom-client');

const fallbackRegister = (message = 'metrics unavailable') => ({
    contentType: 'text/plain',
    metrics: async () => `# ${message}\n`,
});

const normalizeEnum = (value, allowed, fallback = 'unknown') =>
    allowed.includes(value) ? value : fallback;

export const normalizeProvider = (provider) => {
    const normalized = String(provider || 'unknown')
        .toLowerCase()
        .replace(/[._-]/g, '');
    if (normalized === 'tokenplace') return 'tokenplace';
    if (normalized === 'openai') return 'openai';
    if (normalized === 'none') return 'none';
    return 'unknown';
};

export const normalizeOutcome = (outcome) => normalizeEnum(outcome, OUTCOMES, 'unknown_error');
export const normalizeDependency = (dependency) =>
    normalizeEnum(dependency, DEPENDENCIES, 'openai');
export const statusClass = (status) => {
    const code = Number(status);
    if (!Number.isFinite(code)) return 'unknown';
    return `${Math.floor(code / 100)}xx`;
};

export const normalizeRoute = (urlOrPath = '/') => {
    let pathname;
    try {
        pathname = new URL(urlOrPath, 'http://dspace.local').pathname;
    } catch {
        pathname = '/unknown';
    }
    if (pathname === '/metrics') return '/metrics';
    if (pathname === '/') return '/';
    if (['/healthz', '/health', '/livez', '/config.json', '/build-meta.json'].includes(pathname)) {
        return pathname;
    }
    if (pathname.startsWith('/docs/')) return '/docs/[slug]';
    if (pathname.startsWith('/inventory/item/')) return '/inventory/item/[itemId]';
    if (pathname.startsWith('/processes/')) return '/processes/[processId]';
    if (pathname.startsWith('/quests/')) return '/quests/[pathId]/[questId]';
    if (pathname.startsWith('/_astro/')) return '/_astro/*';
    if (pathname.startsWith('/assets/')) return '/assets/*';
    return pathname.replace(/\/[0-9A-Za-z_-]{8,}(?=\/|$)/g, '/[id]');
};

const getOrCreate = (name, create) => register.getSingleMetric(name) || create();
const secondsSince = (started) => Math.max(0, (Date.now() - started) / 1000);

function initMetricFamilies() {
    getOrCreate(
        'dspace_http_requests_total',
        () =>
            new client.Counter({
                name: 'dspace_http_requests_total',
                help: 'DSPACE HTTP requests by bounded route, status class, and outcome.',
                labelNames: ['method', 'route', 'status_class', 'outcome'],
                registers: [register],
            })
    );
    getOrCreate(
        'dspace_http_request_duration_seconds',
        () =>
            new client.Histogram({
                name: 'dspace_http_request_duration_seconds',
                help: 'DSPACE HTTP request duration in seconds.',
                labelNames: ['method', 'route', 'status_class', 'outcome'],
                buckets: HTTP_BUCKETS,
                registers: [register],
            })
    );
    getOrCreate(
        'dspace_dchat_requests_total',
        () =>
            new client.Counter({
                name: 'dspace_dchat_requests_total',
                help: 'DSPACE dChat logical requests by bounded provider and outcome.',
                labelNames: ['provider', 'outcome'],
                registers: [register],
            })
    );
    getOrCreate(
        'dspace_dchat_request_duration_seconds',
        () =>
            new client.Histogram({
                name: 'dspace_dchat_request_duration_seconds',
                help: 'DSPACE dChat logical request duration in seconds.',
                labelNames: ['provider', 'outcome'],
                buckets: CHAT_BUCKETS,
                registers: [register],
            })
    );
    getOrCreate(
        'dspace_dependency_requests_total',
        () =>
            new client.Counter({
                name: 'dspace_dependency_requests_total',
                help: 'DSPACE outbound dependency requests by bounded dependency and outcome.',
                labelNames: ['dependency', 'outcome'],
                registers: [register],
            })
    );
    getOrCreate(
        'dspace_dependency_request_duration_seconds',
        () =>
            new client.Histogram({
                name: 'dspace_dependency_request_duration_seconds',
                help: 'DSPACE outbound dependency request duration in seconds.',
                labelNames: ['dependency', 'outcome'],
                buckets: CHAT_BUCKETS,
                registers: [register],
            })
    );
    getOrCreate(
        'dspace_build_info',
        () =>
            new client.Gauge({
                name: 'dspace_build_info',
                help: 'DSPACE build information with low-cardinality labels.',
                labelNames: ['version', 'revision'],
                registers: [register],
            })
    ).set(
        {
            version: process.env.npm_package_version || '3.0.1',
            revision: process.env.GIT_SHA || process.env.SOURCE_VERSION || 'unknown',
        },
        1
    );
    instrumentationUp = getOrCreate(
        'dspace_instrumentation_up',
        () =>
            new client.Gauge({
                name: 'dspace_instrumentation_up',
                help: 'DSPACE metrics instrumentation initialization status.',
                registers: [register],
            })
    );
    instrumentationUp.set(1);
}

async function initMetrics(loader = defaultLoader) {
    try {
        const loaded = await loader();
        client = loaded.default || loaded;
        const { Registry, collectDefaultMetrics } = client;
        const isExistingRegister = Boolean(globalThis.__dspaceMetricsRegister);
        register = globalThis.__dspaceMetricsRegister || new Registry();
        globalThis.__dspaceMetricsRegister = register;
        if (!isExistingRegister) collectDefaultMetrics({ register });
        initMetricFamilies();
        initializationError = null;
    } catch (error) {
        initializationError = error;
        register = fallbackRegister('metrics initialization failed');
    }
}

await initMetrics();

export const isMetricsReady = () => Boolean(client && register && !initializationError);
export const getMetricsInitializationError = () => initializationError;

export function recordHttpRequest({
    method = 'GET',
    route = '/',
    status = 200,
    outcome = 'success',
    durationSeconds = 0,
}) {
    if (!isMetricsReady() || normalizeRoute(route) === '/metrics') return;
    const labels = {
        method: String(method).toUpperCase(),
        route: normalizeRoute(route),
        status_class: statusClass(status),
        outcome: normalizeOutcome(outcome),
    };
    register.getSingleMetric('dspace_http_requests_total')?.inc(labels);
    register
        .getSingleMetric('dspace_http_request_duration_seconds')
        ?.observe(labels, durationSeconds);
}

export function recordDchatRequest({
    provider = 'unknown',
    outcome = 'unknown_error',
    durationSeconds = 0,
}) {
    if (!isMetricsReady()) return;
    const labels = { provider: normalizeProvider(provider), outcome: normalizeOutcome(outcome) };
    register.getSingleMetric('dspace_dchat_requests_total')?.inc(labels);
    register
        .getSingleMetric('dspace_dchat_request_duration_seconds')
        ?.observe(labels, durationSeconds);
}

export function recordDependencyRequest({
    dependency = 'openai',
    outcome = 'unknown_error',
    durationSeconds = 0,
}) {
    if (!isMetricsReady()) return;
    const labels = {
        dependency: normalizeDependency(dependency),
        outcome: normalizeOutcome(outcome),
    };
    register.getSingleMetric('dspace_dependency_requests_total')?.inc(labels);
    register
        .getSingleMetric('dspace_dependency_request_duration_seconds')
        ?.observe(labels, durationSeconds);
}

export function classifyErrorOutcome(error) {
    const type = String(error?.type || '').toLowerCase();
    const status = Number(error?.status);
    const name = String(error?.name || '').toLowerCase();
    const message = String(error?.message || '').toLowerCase();
    if (
        type === 'abort' ||
        status === 408 ||
        name.includes('abort') ||
        message.includes('timeout') ||
        message.includes('timed out')
    )
        return 'timeout';
    if (type === 'rate_limit' || status === 429) return 'rate_limited';
    if (type === 'validation' || status === 400 || status === 413) return 'validation_error';
    if (type === 'malformed') return 'malformed_response';
    if (type === 'network' || type === 'provider') return 'dependency_failure';
    if (type === 'server' || status >= 500) return 'server_error';
    return 'unknown_error';
}

export function metricsTimer() {
    const started = Date.now();
    return () => secondsSince(started);
}

export { register, initMetrics };
