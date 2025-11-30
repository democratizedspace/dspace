import type { APIRoute } from 'astro';
import { parseFeatureFlags, readBooleanOverride } from '../utils/featureFlags';

export const prerender = false;

const runtimeStartedAt = Date.now();

export const GET: APIRoute = async () => {
    const { tokens, overrides } = parseFeatureFlags(process.env.DSPACE_FEATURE_FLAGS);

    const offlineWorkerEnvOverride = readBooleanOverride(
        process.env.DSPACE_OFFLINE_WORKER_ENABLED
    );
    const offlineOverride = readBooleanOverride(overrides.get('offlineWorker.enabled'));
    const offlineWorkerEnabled =
        offlineWorkerEnvOverride ?? offlineOverride ?? true;

    const body = {
        offlineWorker: {
            enabled: offlineWorkerEnabled,
        },
        featureFlags: tokens,
        environment: process.env.NODE_ENV || 'production',
        version: process.env.npm_package_version,
        uptimeSeconds: Math.round(process.uptime()),
        startedAt: new Date(runtimeStartedAt).toISOString(),
    };

    return new Response(JSON.stringify(body), {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
        },
    });
};
