let register;
let httpRequestCounter;
let httpRequestDuration;

const defaultLoader = () => import(/* @vite-ignore */ 'prom-client');

const noopTimer = () => () => undefined;

function setFallbackMetrics() {
    register = {
        contentType: 'text/plain',
        metrics: async () => '# metrics unavailable\n',
    };
    httpRequestCounter = { inc: () => undefined };
    httpRequestDuration = { startTimer: noopTimer };
}

setFallbackMetrics();

async function initMetrics(loader = defaultLoader) {
    try {
        const { Registry, collectDefaultMetrics, Counter, Histogram } = await loader();
        register = new Registry();
        collectDefaultMetrics({ register });
        httpRequestCounter = new Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests received by the server.',
            labelNames: ['method', 'route', 'status_code'],
            registers: [register],
        });
        httpRequestDuration = new Histogram({
            name: 'http_request_duration_seconds',
            help: 'HTTP request duration in seconds.',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.3, 0.5, 1, 3, 5, 10],
            registers: [register],
        });
    } catch {
        setFallbackMetrics();
    }
}

await initMetrics();

export { register, initMetrics, httpRequestCounter, httpRequestDuration };
