import type { FeatureFlagParseResult } from '@dspace/feature-flags';
import { parseFeatureFlags, readBooleanOverride } from '@dspace/feature-flags';
import { readFile } from 'node:fs/promises';
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

const normalizeValue = (value: unknown) => String(value ?? '').trim();

const isPlaceholder = (value: unknown) => {
    const normalized = normalizeValue(value).toLowerCase();
    return (
        !normalized ||
        normalized === 'unknown' ||
        normalized === 'missing' ||
        normalized === 'missing-sha' ||
        normalized === 'dev-local'
    );
};

const resolveBuildMetaCandidates = () => {
    const candidates = new Set<string>();
    if (process.env.DSPACE_BUILD_META_PATH) {
        candidates.add(process.env.DSPACE_BUILD_META_PATH);
    }
    candidates.add('/app/build_meta.json');
    const cwd = process.cwd();
    candidates.add(path.join(cwd, 'frontend', 'src', 'generated', 'build_meta.json'));
    candidates.add(path.join(cwd, 'src', 'generated', 'build_meta.json'));
    return Array.from(candidates);
};

const resolveEnvBuildMeta = () => {
    const envSha =
        process.env.GITHUB_SHA ||
        process.env.GIT_SHA ||
        process.env.VITE_GIT_SHA ||
        process.env.COMMIT_SHA ||
        '';
    const gitSha = normalizeValue(envSha);
    if (isPlaceholder(gitSha)) {
        return null;
    }
    return {
        gitSha,
        generatedAt: normalizeValue(process.env.BUILD_TIMESTAMP || '') || null,
        source: 'env',
        resolvedFrom: 'env',
    };
};

const readBuildMeta = async () => {
    const candidates = resolveBuildMetaCandidates();
    for (const candidate of candidates) {
        try {
            const raw = await readFile(candidate, 'utf8');
            const parsed = JSON.parse(raw);
            const gitSha = normalizeValue(parsed?.gitSha);
            if (isPlaceholder(gitSha)) {
                continue;
            }
            return {
                gitSha,
                generatedAt: normalizeValue(parsed?.generatedAt) || null,
                source: normalizeValue(parsed?.source) || 'build-meta',
                resolvedFrom: candidate,
            };
        } catch (error) {
            continue;
        }
    }
    return resolveEnvBuildMeta();
};

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

export async function buildRuntimeBuildMetaResponse(): Promise<Response> {
    try {
        const meta = await readBuildMeta();
        if (!meta) {
            return new Response(JSON.stringify({ error: 'build_meta_unavailable' }), {
                status: 503,
                headers: buildHeaders(),
            });
        }
        return new Response(JSON.stringify(meta), {
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
