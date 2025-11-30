import type { APIRoute } from 'astro';
import { parseFeatureFlags, readBooleanOverride } from './featureFlags';

type RuntimeConfig = {
    offlineWorker: {
        enabled: boolean;
    };
    featureFlags: string[];
};

type HealthPayload = {
    status: 'ok';
    uptimeSeconds: number;
    version: string;
};

const jsonHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
};

export function buildRuntimeConfig(): RuntimeConfig {
    const { tokens, overrides } = parseFeatureFlags(process.env.DSPACE_FEATURE_FLAGS);
    const offlineOverride = readBooleanOverride(overrides.get('offlineWorker.enabled'));
    const offlineWorkerEnabled = offlineOverride ?? true;

    return {
        offlineWorker: {
            enabled: offlineWorkerEnabled,
        },
        featureFlags: tokens,
    };
}

export function createRuntimeConfigResponse(): Response {
    return new Response(JSON.stringify(buildRuntimeConfig()), { headers: jsonHeaders });
}

export function createHealthPayload(): HealthPayload {
    return {
        status: 'ok',
        uptimeSeconds: Math.round(process.uptime()),
        version: process.env.npm_package_version ?? 'unknown',
    };
}

export function createHealthResponse(): Response {
    return new Response(JSON.stringify(createHealthPayload()), { headers: jsonHeaders });
}

export const runtimeConfigGET: APIRoute = async () => createRuntimeConfigResponse();
export const healthGET: APIRoute = async () => createHealthResponse();
