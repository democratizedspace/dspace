import fs from 'node:fs/promises';
import path from 'node:path';
import { logServerError } from './serverLogger';

const RUNTIME_BUILD_META_PATH = '/app/build_meta.json';
const REPO_BUILD_META_PATH = path.join(
    process.cwd(),
    'frontend',
    'src',
    'generated',
    'build_meta.json'
);
const FRONTEND_BUILD_META_PATH = path.join(process.cwd(), 'src', 'generated', 'build_meta.json');
const FULL_SHA = /^[0-9a-f]{40}$/i;

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
        if (isPlaceholderSha(gitSha) || !FULL_SHA.test(gitSha)) {
            return null;
        }
        const generatedAt = normalizeSha(parsed?.generatedAt);
        const source = normalizeSha(parsed?.source) || 'build-meta';
        const version = normalizeSha(parsed?.version);
        const shortRevision = gitSha.slice(0, 7);
        if (!version || !generatedAt || Number.isNaN(Date.parse(generatedAt))) return null;
        if (parsed.shortRevision && parsed.shortRevision !== shortRevision) return null;
        const image = normalizeSha(parsed?.image);
        if (image) {
            const escaped = shortRevision.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (
                !new RegExp(
                    `^[a-z0-9.-]+(?:/[a-z0-9._-]+)+:[a-z0-9._-]+-${escaped}$`,
                    'i'
                ).test(image)
            ) {
                return null;
            }
        }

        return {
            gitSha,
            version,
            revision: gitSha,
            shortRevision,
            generatedAt,
            ...(image ? { image } : {}),
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

export async function buildRuntimeBuildMetaResponse(route = '/build-meta.json') {
    try {
        const meta = await resolveRuntimeBuildMeta();
        if (isPlaceholderSha(meta.gitSha)) {
            const message = 'Runtime build metadata is missing or invalid';
            logServerError({
                route,
                method: 'GET',
                error: message,
                context: { meta },
            });
            return new Response(JSON.stringify(toPublicMeta(meta)), {
                status: 503,
                headers: buildHeaders(),
            });
        }

        return new Response(JSON.stringify(toPublicMeta(meta)), {
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
