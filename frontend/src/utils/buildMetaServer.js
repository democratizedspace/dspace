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
            applicationVersion: normalizeSha(parsed?.applicationVersion),
            revision: normalizeSha(parsed?.revision),
            shortRevision: normalizeSha(parsed?.shortRevision),
            builtAt: normalizeSha(parsed?.builtAt),
            ...(normalizeSha(parsed?.image) ? { image: normalizeSha(parsed.image) } : {}),
            gitSha,
            generatedAt,
            source,
            resolvedFrom: filePath,
        };
    } catch (error) {
        return null;
    }
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

export async function buildRuntimeBuildMetaResponse({
    compatibility = true,
    resolver = resolveRuntimeBuildMeta,
    route = compatibility ? '/build-meta.json' : '/build-info.json',
} = {}) {
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
            const body = compatibility
                ? toPublicMeta(meta)
                : { error: 'build_identity_unavailable' };
            return new Response(JSON.stringify(body), {
                status: 503,
                headers: buildHeaders(),
            });
        }

        const body = compatibility ? { ...toPublicMeta(meta), ...identity } : identity;
        return new Response(JSON.stringify(body), {
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

        const body = compatibility
            ? { gitSha: 'missing', source: 'missing' }
            : { error: 'build_identity_unavailable' };
        return new Response(JSON.stringify(body), {
            status: 503,
            headers: buildHeaders(),
        });
    }
}
