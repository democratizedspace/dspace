import { register } from '../utils/metrics.js';

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

    const metrics = await register.metrics();
    return new Response(metrics, {
        headers: { 'Content-Type': register.contentType },
    });
}
