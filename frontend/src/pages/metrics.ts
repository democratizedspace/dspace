import { register } from '../utils/metrics.js';

export const prerender = false;

export async function GET() {
    const metrics = await register.metrics();
    return new Response(metrics, {
        headers: { 'Content-Type': register.contentType },
    });
}
