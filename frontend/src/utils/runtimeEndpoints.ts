import type { FeatureFlagParseResult } from './featureFlags';
import { parseFeatureFlags, readBooleanOverride } from './featureFlags';
import { logServerError } from './serverLogger';

function parseOfflineWorkerEnabled(flags: FeatureFlagParseResult): boolean {
    const envOverride = readBooleanOverride(process.env.DSPACE_OFFLINE_WORKER_ENABLED);
    if (envOverride !== undefined) {
        return envOverride;
    }

    const flagOverride = readBooleanOverride(flags.overrides.get('offlineWorker.enabled'));
    return flagOverride ?? true;
}

function buildHeaders(): HeadersInit {
    return {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
    };
}

export function buildRuntimeConfigResponse(route = '/config.json'): Response {
    try {
        const flags = parseFeatureFlags(process.env.DSPACE_FEATURE_FLAGS);
        const offlineWorkerEnabled = parseOfflineWorkerEnabled(flags);

        const body = {
            offlineWorker: {
                enabled: offlineWorkerEnabled,
            },
            featureFlags: flags.tokens,
        };

        return new Response(JSON.stringify(body), {
            status: 200,
            headers: buildHeaders(),
        });
    } catch (error) {
        logServerError({
            route,
            method: 'GET',
            message: 'Failed to build runtime config response',
            error,
        });

        return new Response(JSON.stringify({ error: 'config_unavailable' }), {
            status: 503,
            headers: buildHeaders(),
        });
    }
}

function buildHealthBody(status: 'ready' | 'alive') {
    const flags = parseFeatureFlags(process.env.DSPACE_FEATURE_FLAGS);
    const startedAt = new Date(Date.now() - process.uptime() * 1000);

    return {
        status,
        uptimeSeconds: process.uptime(),
        startedAt: startedAt.toISOString(),
        timestamp: new Date().toISOString(),
        version: process.env.DSPACE_VERSION || process.env.npm_package_version || 'unknown',
        features: flags.tokens,
    };
}

export function buildHealthResponse(route = '/healthz'): Response {
    try {
        return new Response(JSON.stringify(buildHealthBody('ready')), {
            status: 200,
            headers: buildHeaders(),
        });
    } catch (error) {
        logServerError({
            route,
            method: 'GET',
            message: 'Failed to build health response',
            error,
        });

        return new Response(JSON.stringify({ status: 'unhealthy' }), {
            status: 503,
            headers: buildHeaders(),
        });
    }
}

export function buildLivezResponse(route = '/livez'): Response {
    try {
        return new Response(JSON.stringify(buildHealthBody('alive')), {
            status: 200,
            headers: buildHeaders(),
        });
    } catch (error) {
        logServerError({
            route,
            method: 'GET',
            message: 'Failed to build livez response',
            error,
        });

        return new Response(JSON.stringify({ status: 'unhealthy' }), {
            status: 503,
            headers: buildHeaders(),
        });
    }
}
