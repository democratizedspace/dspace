import fs from 'node:fs/promises';
import path from 'node:path';
import { logServerError } from './serverLogger';
import { normalizeBuildIdentity } from './buildIdentity.js';

const RUNTIME_BUILD_META_PATH = '/app/build_meta.json';
const REPO_BUILD_META_PATH = path.join(
    process.cwd(),
    'frontend',
    'src',
    'generated',
    'build_meta.json'
);
const FRONTEND_BUILD_META_PATH = path.join(process.cwd(), 'src', 'generated', 'build_meta.json');
const ENV_SOURCES = ['GITHUB_SHA', 'VITE_GIT_SHA', 'GIT_SHA', 'DSPACE_GIT_SHA'];

const normalizeSha = (value) => String(value || '').trim();

const isPlaceholderSha = (value) => {
    const normalized = normalizeSha(value);
    if (!normalized) {
        return true;
    }
    const lower = normalized.toLowerCase();
    return (
        lower === 'unknown' ||
        lower === 'dev-local' ||
        lower === 'missing' ||
        lower === 'missing-sha'
    );
};

const readBuildMetaFile = async (filePath) => {
    try {
        const raw = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        const gitSha = normalizeSha(parsed?.gitSha);
        if (isPlaceholderSha(gitSha)) {
            return null;
        }
        const generatedAt = normalizeSha(parsed?.generatedAt);
        const source = normalizeSha(parsed?.source) || 'build-meta';

        return {
            version: normalizeSha(parsed?.version),
            gitSha,
            revision: normalizeSha(parsed?.revision) || gitSha,
            shortRevision: normalizeSha(parsed?.shortRevision),
            generatedAt,
            builtAt: normalizeSha(parsed?.builtAt) || generatedAt,
            ...(normalizeSha(parsed?.image) ? { image: normalizeSha(parsed.image) } : {}),
            source,
            resolvedFrom: filePath,
        };
    } catch (error) {
        return null;
    }
};

const resolveBuildMetaFromEnv = () => {
    for (const key of ENV_SOURCES) {
        const gitSha = normalizeSha(process.env[key]);
        if (!isPlaceholderSha(gitSha)) {
            return {
                gitSha,
                generatedAt: new Date().toISOString(),
                source: `env:${key}`,
                resolvedFrom: 'env',
            };
        }
    }
    return null;
};

export const resolveRuntimeBuildMeta = async () => {
    const runtimeMeta = await readBuildMetaFile(RUNTIME_BUILD_META_PATH);
    if (runtimeMeta) {
        return runtimeMeta;
    }
    const repoMeta = await readBuildMetaFile(REPO_BUILD_META_PATH);
    if (repoMeta) {
        return repoMeta;
    }
    const frontendMeta = await readBuildMetaFile(FRONTEND_BUILD_META_PATH);
    if (frontendMeta) {
        return frontendMeta;
    }
    const envMeta = resolveBuildMetaFromEnv();
    if (envMeta) {
        return envMeta;
    }
    return {
        gitSha: 'missing',
        generatedAt: '',
        source: 'missing',
        resolvedFrom: 'missing',
    };
};

export const resolveRuntimeBuildIdentity = async () =>
    normalizeBuildIdentity(await resolveRuntimeBuildMeta());

const toPublicMeta = (meta) => {
    if (!meta || typeof meta !== 'object') {
        return meta;
    }
    const { resolvedFrom, ...publicMeta } = meta;
    return publicMeta;
};

const buildHeaders = () => ({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
});

export async function buildRuntimeBuildMetaResponse(
    route = '/build-meta.json',
    resolver = resolveRuntimeBuildMeta
) {
    try {
        const meta = await resolver();
        let identity;
        try {
            identity = normalizeBuildIdentity(meta);
        } catch {
            const message = 'Runtime build metadata is missing or invalid';
            logServerError({
                route,
                method: 'GET',
                error: message,
                context: { meta },
            });
            const failureBody =
                route === '/build-meta.json'
                    ? { gitSha: 'missing', source: 'missing' }
                    : { error: 'build_identity_unavailable' };
            return new Response(JSON.stringify(failureBody), {
                status: 503,
                headers: buildHeaders(),
            });
        }

        return new Response(JSON.stringify({ ...toPublicMeta(meta), ...identity }), {
            status: 200,
            headers: buildHeaders(),
        });
    } catch (error) {
        const message = 'Failed to build runtime build metadata response';
        const errorToLog =
            error instanceof Error ? new Error(`${message}: ${error.message}`) : new Error(message);
        logServerError({
            route,
            method: 'GET',
            error: errorToLog,
            context: { error },
        });

        return new Response(JSON.stringify({ gitSha: 'missing', source: 'missing' }), {
            status: 503,
            headers: buildHeaders(),
        });
    }
}

export const buildRuntimeBuildInfoResponse = () =>
    buildRuntimeBuildMetaResponse('/build-info.json');
