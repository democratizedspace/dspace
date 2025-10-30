import { parseFeatureFlags } from '../utils/featureFlags';

export const prerender = false;

export async function GET() {
    const { tokens: featureFlags } = parseFeatureFlags(process.env.DSPACE_FEATURE_FLAGS);

    return new Response(
        JSON.stringify({
            status: 'ready',
            timestamp: new Date().toISOString(),
            features: featureFlags,
        }),
        {
            headers: { 'Content-Type': 'application/json' },
        }
    );
}
