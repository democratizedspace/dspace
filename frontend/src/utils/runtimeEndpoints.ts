import type { FeatureFlagParseResult } from './featureFlags';
import { parseFeatureFlags, readBooleanOverride } from './featureFlags';

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

export function buildRuntimeConfigResponse(): Response {
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

export function buildHealthResponse(): Response {
    return new Response(JSON.stringify(buildHealthBody('ready')), {
        status: 200,
        headers: buildHeaders(),
    });
}

export function buildLivezResponse(): Response {
    return new Response(JSON.stringify(buildHealthBody('alive')), {
        status: 200,
        headers: buildHeaders(),
    });
}
