import { ensureMetricsInitialized, register } from '../utils/metrics.js';

export const prerender = false;

/**
 * Returns Prometheus metrics for the running instance.
 * If the METRICS_TOKEN env var is set, clients must include
 * `Authorization: Bearer <token>` or they'll receive 401.
 */
export async function GET({ request }: { request: Request }) {
    const token = process.env.METRICS_TOKEN;
    if (token) {
        const auth = request.headers.get('authorization');
        if (auth !== `Bearer ${token}`) {
            return new Response('Unauthorized', { status: 401 });
        }
    }

    const status = await ensureMetricsInitialized();
    if (!status.available) {
        return new Response('metrics unavailable\n', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
    }

    const metrics = await register.metrics();
    return new Response(metrics, {
        headers: { 'Content-Type': register.contentType },
    });
}

// Trust boundary: browser/provider clients are untrusted for operational metrics.
// POST /metrics is intentionally non-writable so only server-controlled code paths
// can mutate the Prometheus registry served by the authenticated GET handler.
export async function POST(_context?: { request?: Request }) {
    return new Response('metrics ingestion disabled\n', {
        status: 405,
        headers: { Allow: 'GET', 'Content-Type': 'text/plain; charset=utf-8' },
    });
}
