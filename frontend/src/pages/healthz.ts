import pkg from '../package.json';
import { parseFeatureFlags } from '../utils/featureFlags';

export const prerender = false;

const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
};

export async function GET() {
    const { tokens: featureFlags } = parseFeatureFlags(process.env.DSPACE_FEATURE_FLAGS);
    const uptimeSeconds = Math.round(process.uptime());

    return new Response(
        JSON.stringify({
            status: 'ok',
            uptimeSeconds,
            timestamp: new Date().toISOString(),
            version: pkg.version,
            features: featureFlags,
        }),
        {
            headers,
        }
    );
}
