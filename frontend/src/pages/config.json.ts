import { parseFeatureFlags, readBooleanOverride } from '../utils/featureFlags';

export const prerender = false;

export async function GET() {
    const { tokens, overrides } = parseFeatureFlags(process.env.DSPACE_FEATURE_FLAGS);

    const offlineOverride = readBooleanOverride(overrides.get('offlineWorker.enabled'));
    const offlineWorkerEnabled = offlineOverride ?? true;

    const body = {
        offlineWorker: {
            enabled: offlineWorkerEnabled,
        },
        featureFlags: tokens,
    };

    return new Response(JSON.stringify(body), {
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
