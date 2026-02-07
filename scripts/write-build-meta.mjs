import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = process.env.VERIFY_REPO_ROOT
    ? path.resolve(process.env.VERIFY_REPO_ROOT)
    : path.resolve(__dirname, '..');
const buildMetaPath = process.env.VERIFY_BUILD_META_PATH
    ? path.resolve(process.env.VERIFY_BUILD_META_PATH)
    : path.join(repoRoot, 'frontend/src/generated/build_meta.json');
const allowedSources = new Set(['ci', 'env', 'git']);

const normalizeSha = (value) => String(value || '').trim();

const isPlaceholderSha = (value) => {
    const normalized = normalizeSha(value).toLowerCase();
    return (
        !normalized ||
        normalized === 'unknown' ||
        normalized === 'missing' ||
        normalized === 'missing-sha' ||
        normalized === 'dev-local'
    );
};

export const assertBuildMetaComplete = (payload) => {
    if (!payload || typeof payload !== 'object') {
        throw new Error('build_meta.json payload is missing or invalid.');
    }
    if (isPlaceholderSha(payload.gitSha)) {
        throw new Error(`build_meta.json gitSha is not set: ${payload.gitSha || 'empty'}`);
    }
    if (!normalizeSha(payload.generatedAt)) {
        throw new Error('build_meta.json generatedAt is missing.');
    }
    const source = String(payload.source || '').trim().toLowerCase();
    if (!source || source === 'static' || !allowedSources.has(source)) {
        throw new Error(`build_meta.json source is invalid: ${payload.source || 'empty'}`);
    }
};

export const resolveBuildMeta = () => {
    const envPriority = [
        { key: 'GITHUB_SHA', source: 'ci' },
        { key: 'VITE_GIT_SHA', source: 'env' },
        { key: 'GIT_SHA', source: 'env' },
        { key: 'DSPACE_GIT_SHA', source: 'env' },
    ];

    for (const { key, source } of envPriority) {
        const value = normalizeSha(process.env[key]);
        if (value && !isPlaceholderSha(value)) {
            return { gitSha: value, source };
        }
    }

    try {
        const gitSha = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
        if (isPlaceholderSha(gitSha)) {
            throw new Error('git rev-parse returned an invalid SHA.');
        }
        return { gitSha, source: 'git' };
    } catch (error) {
        throw new Error(
            'Unable to resolve git SHA from environment or git. Provide GITHUB_SHA, VITE_GIT_SHA, GIT_SHA, or DSPACE_GIT_SHA.'
        );
    }
};

export const writeBuildMeta = async ({ gitSha, source = 'build-meta' }) => {
    const payload = {
        gitSha: normalizeSha(gitSha),
        generatedAt: new Date().toISOString(),
        source,
    };
    assertBuildMetaComplete(payload);
    await fs.mkdir(path.dirname(buildMetaPath), { recursive: true });
    await fs.writeFile(buildMetaPath, `${JSON.stringify(payload, null, 4)}\n`);
    return payload;
};

export const readBuildMeta = async () => {
    const rawMeta = await fs.readFile(buildMetaPath, 'utf8');
    return JSON.parse(rawMeta);
};

const run = async () => {
    const { gitSha, source } = resolveBuildMeta();
    await writeBuildMeta({ gitSha, source });
    console.log(`Build metadata written to ${buildMetaPath}`);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    run().catch((error) => {
        console.error('Failed to write build metadata:', error);
        process.exit(1);
    });
}
