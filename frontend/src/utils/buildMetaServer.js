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
        const generatedAt = normalizeSha(parsed?.generatedAt) || new Date().toISOString();
        const source = normalizeSha(parsed?.source) || 'build-meta';

        return {
            gitSha,
            generatedAt,
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

const buildHeaders = () => ({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
});

export async function buildRuntimeBuildMetaResponse() {
    try {
        const meta = await resolveRuntimeBuildMeta();
        if (isPlaceholderSha(meta.gitSha)) {
            logServerError({
                route: '/build-meta.json',
                method: 'GET',
                message: 'Runtime build metadata is missing or invalid',
                error: meta,
            });
            return new Response(JSON.stringify(meta), {
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

        return new Response(JSON.stringify({ gitSha: 'missing', source: 'missing' }), {
            status: 503,
            headers: buildHeaders(),
        });
    }
}
