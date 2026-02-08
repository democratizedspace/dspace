import fs from 'node:fs/promises';
import path from 'node:path';
import { logServerError } from './serverLogger';

export type RuntimeBuildMeta = {
    gitSha: string;
    generatedAt?: string;
    source?: string;
    origin?: string;
};

const normalizeValue = (value: unknown) => String(value ?? '').trim();

const isPlaceholderSha = (value: string) => {
    const normalized = normalizeValue(value).toLowerCase();
    return (
        !normalized ||
        normalized === 'unknown' ||
        normalized === 'missing' ||
        normalized === 'missing-sha' ||
        normalized === 'dev-local'
    );
};

const normalizeMeta = (
    payload: Record<string, unknown> | null,
    origin?: string
): RuntimeBuildMeta | null => {
    if (!payload) {
        return null;
    }
    const gitSha = normalizeValue(payload.gitSha);
    if (!gitSha) {
        return null;
    }
    return {
        gitSha,
        generatedAt: normalizeValue(payload.generatedAt) || undefined,
        source: normalizeValue(payload.source) || undefined,
        origin,
    };
};

const buildDefaultPaths = () => {
    const cwd = process.cwd();
    return [
        '/app/build_meta.json',
        path.resolve(cwd, 'frontend', 'src', 'generated', 'build_meta.json'),
        path.resolve(cwd, 'src', 'generated', 'build_meta.json'),
    ];
};

const readBuildMetaFile = async (filePath: string, origin: string) => {
    try {
        const raw = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        return normalizeMeta(parsed, origin);
    } catch (error) {
        if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') {
            logServerError({
                route: '/build-meta.json',
                method: 'GET',
                message: `Failed to read build metadata from ${filePath}`,
                error,
            });
        }
        return null;
    }
};

const readEnvMeta = (env: NodeJS.ProcessEnv): RuntimeBuildMeta | null => {
    const candidates = [
        { key: 'GITHUB_SHA', source: 'ci' },
        { key: 'VITE_GIT_SHA', source: 'env' },
        { key: 'GIT_SHA', source: 'env' },
        { key: 'DSPACE_GIT_SHA', source: 'env' },
    ];

    for (const { key, source } of candidates) {
        const gitSha = normalizeValue(env[key]);
        if (gitSha && !isPlaceholderSha(gitSha)) {
            return {
                gitSha,
                generatedAt:
                    normalizeValue(env.BUILD_TIMESTAMP ?? env.BUILD_TIME ?? env.BUILD_DATE) ||
                    undefined,
                source,
                origin: 'env',
            };
        }
    }

    return null;
};

export async function resolveRuntimeBuildMeta(
    options: {
        paths?: string[];
        env?: NodeJS.ProcessEnv;
    } = {}
): Promise<RuntimeBuildMeta | null> {
    const paths = options.paths ?? buildDefaultPaths();
    const env = options.env ?? process.env;

    for (const [index, filePath] of paths.entries()) {
        const origin = index === 0 ? 'runtime-file' : 'repo-file';
        const meta = await readBuildMetaFile(filePath, origin);
        if (meta && !isPlaceholderSha(meta.gitSha)) {
            return meta;
        }
    }

    const envMeta = readEnvMeta(env);
    if (envMeta && !isPlaceholderSha(envMeta.gitSha)) {
        return envMeta;
    }

    return null;
}

const buildHeaders = (): HeadersInit => ({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
});

export async function buildRuntimeBuildMetaResponse(): Promise<Response> {
    try {
        const meta = await resolveRuntimeBuildMeta();
        if (!meta) {
            logServerError({
                route: '/build-meta.json',
                method: 'GET',
                message: 'Runtime build metadata unavailable',
            });
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
