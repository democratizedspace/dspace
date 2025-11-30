import { parseFeatureFlags, readBooleanOverride } from '../utils/featureFlags';

export const prerender = false;

const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
};

export async function GET() {
    const { tokens, overrides } = parseFeatureFlags(process.env.DSPACE_FEATURE_FLAGS);

    const offlineFeatureOverride = readBooleanOverride(overrides.get('offlineWorker.enabled'));
    const offlineEnvOverride = readBooleanOverride(process.env.DSPACE_OFFLINE_WORKER_ENABLED);
    const offlineWorkerEnabled = offlineEnvOverride ?? offlineFeatureOverride ?? true;

    const body = {
        offlineWorker: {
            enabled: offlineWorkerEnabled,
        },
        featureFlags: tokens,
        environment: process.env.NODE_ENV ?? 'production',
    };

    return new Response(JSON.stringify(body), { headers });
}
