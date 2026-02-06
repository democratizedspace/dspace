import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const buildMetaPath = path.join(repoRoot, 'frontend/src/generated/build_meta.json');

const normalizeSha = (value) => String(value || '').trim();

const isPlaceholderSha = (value) => {
    const normalized = normalizeSha(value).toLowerCase();
    if (!normalized) {
        return true;
    }
    return (
        normalized === 'unknown' ||
        normalized === 'dev-local' ||
        normalized === 'missing' ||
        normalized === 'missing-sha'
    );
};

export const resolveGitSha = () => {
    const envSha =
        process.env.VITE_GIT_SHA || process.env.DSPACE_GIT_SHA || process.env.GIT_SHA;
    const normalizedEnvSha = normalizeSha(envSha);
    if (normalizedEnvSha && !isPlaceholderSha(normalizedEnvSha)) {
        return { gitSha: normalizedEnvSha, source: 'ci' };
    }

    try {
        const gitSha = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
        return { gitSha, source: 'git' };
    } catch (error) {
        return { gitSha: 'unknown', source: 'unknown' };
    }
};

export const writeBuildMeta = async ({ gitSha, source }) => {
    const payload = {
        gitSha,
        generatedAt: new Date().toISOString(),
        source,
    };
    await fs.mkdir(path.dirname(buildMetaPath), { recursive: true });
    await fs.writeFile(buildMetaPath, `${JSON.stringify(payload, null, 4)}\n`);
};

if (import.meta.url === `file://${process.argv[1]}`) {
    const resolvedMeta = resolveGitSha();
    await writeBuildMeta(resolvedMeta);
}
