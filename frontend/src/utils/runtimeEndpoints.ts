import type { FeatureFlagParseResult } from '@dspace/feature-flags';
import { parseFeatureFlags, readBooleanOverride } from '@dspace/feature-flags';
import fs from 'node:fs/promises';
import path from 'node:path';
import { logServerError } from './serverLogger';

function parseOfflineWorkerEnabled(flags: FeatureFlagParseResult): boolean {
    const envOverride = readBooleanOverride(process.env.DSPACE_OFFLINE_WORKER_ENABLED);
    if (envOverride !== undefined) {
        return envOverride;
    }

    const flagOverride = readBooleanOverride(flags.overrides.get('offlineWorker.enabled'));
    return flagOverride ?? true;
}

function parseTelemetryEnabled(flags: FeatureFlagParseResult): boolean {
    const envOverride = readBooleanOverride(process.env.DSPACE_TELEMETRY_ENABLED);
    if (envOverride !== undefined) {
        return envOverride;
    }

    const flagOverride = readBooleanOverride(flags.overrides.get('telemetry.enabled'));
    return flagOverride ?? false;
}

function buildHeaders(): HeadersInit {
    return {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
    };
}

type BuildMetaPayload = {
    gitSha: string;
    generatedAt: string;
    source: string;
    path?: string;
};

const normalizeSha = (value: unknown) => String(value || '').trim();

const isPlaceholderSha = (value: unknown) => {
    const normalized = normalizeSha(value).toLowerCase();
    return (
        !normalized ||
        normalized === 'unknown' ||
        normalized === 'missing' ||
        normalized === 'missing-sha' ||
        normalized === 'dev-local'
    );
};

const resolveBuildMetaPaths = () => [
    '/app/build_meta.json',
    path.resolve(process.cwd(), 'frontend', 'src', 'generated', 'build_meta.json'),
];

const resolveEnvSha = () => {
    const envPriority = ['GITHUB_SHA', 'VITE_GIT_SHA', 'GIT_SHA', 'DSPACE_GIT_SHA'];
    for (const key of envPriority) {
        const value = normalizeSha(process.env[key]);
        if (value && !isPlaceholderSha(value)) {
            return { gitSha: value, source: `env:${key}` };
        }
    }
    return null;
};

const readBuildMetaFile = async (metaPath: string) => {
    try {
        const raw = await fs.readFile(metaPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (isPlaceholderSha(parsed?.gitSha)) {
            return null;
        }
        const generatedAt = normalizeSha(parsed?.generatedAt);
        const source = normalizeSha(parsed?.source) || 'build-meta';
        if (!generatedAt) {
            return null;
        }
        return {
            gitSha: normalizeSha(parsed?.gitSha),
            generatedAt,
            source,
            path: metaPath,
        };
    } catch {
        return null;
    }
};

const resolveBuildMeta = async (): Promise<BuildMetaPayload> => {
    for (const metaPath of resolveBuildMetaPaths()) {
        const payload = await readBuildMetaFile(metaPath);
        if (payload) {
            return payload;
        }
    }

    const envPayload = resolveEnvSha();
    if (envPayload) {
        return {
            gitSha: envPayload.gitSha,
            generatedAt: new Date().toISOString(),
            source: envPayload.source,
        };
    }

    return {
        gitSha: 'missing',
        generatedAt: new Date().toISOString(),
        source: 'missing',
    };
};

export async function buildBuildMetaResponse(): Promise<Response> {
    try {
        const payload = await resolveBuildMeta();
        return new Response(JSON.stringify(payload), {
            status: 200,
            headers: buildHeaders(),
        });
    } catch (error) {
        logServerError({
            route: '/build-meta.json',
            method: 'GET',
            message: 'Failed to build runtime build metadata response',
            error,
        });

        return new Response(JSON.stringify({ error: 'build_meta_unavailable' }), {
            status: 503,
            headers: buildHeaders(),
        });
    }
}

export function buildRuntimeConfigResponse(): Response {
    try {
        const flags = parseFeatureFlags(process.env.DSPACE_FEATURE_FLAGS);
        const offlineWorkerEnabled = parseOfflineWorkerEnabled(flags);
        const telemetryEnabled = parseTelemetryEnabled(flags);

        const body = {
            offlineWorker: {
                enabled: offlineWorkerEnabled,
            },
            telemetry: {
                enabled: telemetryEnabled,
            },
            featureFlags: flags.tokens,
        };

        return new Response(JSON.stringify(body), {
            status: 200,
            headers: buildHeaders(),
        });
    } catch (error) {
        logServerError({
            route: '/config.json',
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

    const version = process.env.DSPACE_VERSION || process.env.npm_package_version || 'unknown';
    const environment = process.env.DSPACE_ENV || 'unknown';

    return {
        status,
        uptimeSeconds: process.uptime(),
        startedAt: startedAt.toISOString(),
        timestamp: new Date().toISOString(),
        version,
        env: environment,
        features: flags.tokens,
    };
}

export function buildHealthResponse(): Response {
    try {
        return new Response(JSON.stringify(buildHealthBody('ready')), {
            status: 200,
            headers: buildHeaders(),
        });
    } catch (error) {
        logServerError({
            route: '/health',
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

export function buildLivezResponse(): Response {
    try {
        return new Response(JSON.stringify(buildHealthBody('alive')), {
            status: 200,
            headers: buildHeaders(),
        });
    } catch (error) {
        logServerError({
            route: '/livez',
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
