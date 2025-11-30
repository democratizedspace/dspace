import type { FeatureFlagParseResult } from './featureFlags';
import { parseFeatureFlags, readBooleanOverride } from './featureFlags';

const startedAt = Date.now();

function parseOfflineWorkerEnabled(flags: FeatureFlagParseResult): boolean {
    const envOverride = readBooleanOverride(process.env.DSPACE_OFFLINE_WORKER_ENABLED);
    if (envOverride !== undefined) {
        return envOverride;
    }

    const flagOverride = readBooleanOverride(flags.overrides.get('offlineWorker.enabled'));
    return flagOverride ?? true;
}

function buildHeaders(existing?: HeadersInit): HeadersInit {
    const baseHeaders: Record<string, string> = {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
    };

    if (!existing) {
        return baseHeaders;
    }

    const merged = new Headers(existing);
    for (const [key, value] of Object.entries(baseHeaders)) {
        if (!merged.has(key)) {
            merged.set(key, value);
        }
    }

    return merged;
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

function buildHealthBody() {
    return {
        status: 'ok',
        uptimeSeconds: process.uptime(),
        startedAt: new Date(startedAt).toISOString(),
        timestamp: new Date().toISOString(),
        version: process.env.DSPACE_VERSION || process.env.npm_package_version || 'unknown',
    };
}

export function buildHealthResponse(): Response {
    return new Response(JSON.stringify(buildHealthBody()), {
        status: 200,
        headers: buildHeaders(),
    });
}

export function buildLivezResponse(): Response {
    return new Response(JSON.stringify(buildHealthBody()), {
        status: 200,
        headers: buildHeaders(),
    });
}
