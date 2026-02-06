import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const buildMetaPath = path.join(repoRoot, 'frontend/src/generated/build_meta.json');

const normalizeSha = (value) => String(value || '').trim();

export const resolveGitSha = () => {
    const envSha =
        process.env.VITE_GIT_SHA || process.env.DSPACE_GIT_SHA || process.env.GIT_SHA;
    const normalizedEnvSha = normalizeSha(envSha);
    if (normalizedEnvSha && normalizedEnvSha.toLowerCase() !== 'unknown') {
        return normalizedEnvSha;
    }

    try {
        return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    } catch (error) {
        return 'unknown';
    }
};

export const writeBuildMeta = async (gitSha, source = 'build-meta') => {
    const payload = {
        gitSha: normalizeSha(gitSha) || 'unknown',
        generatedAt: new Date().toISOString(),
        source,
    };
    await fs.mkdir(path.dirname(buildMetaPath), { recursive: true });
    await fs.writeFile(buildMetaPath, `${JSON.stringify(payload, null, 4)}\n`);
    return payload;
};

const run = async () => {
    const gitSha = resolveGitSha();
    await writeBuildMeta(gitSha, 'build-meta');
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    run().catch((error) => {
        console.error('Failed to write build metadata:', error);
        process.exit(1);
    });
}
