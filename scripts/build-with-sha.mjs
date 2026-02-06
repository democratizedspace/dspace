import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const buildMetaPath = path.join(repoRoot, 'frontend/src/generated/build_meta.json');

const resolveGitSha = () => {
    const envSha =
        process.env.VITE_GIT_SHA || process.env.DSPACE_GIT_SHA || process.env.GIT_SHA;
    if (envSha) {
        const normalizedEnvSha = envSha.trim();
        if (normalizedEnvSha && normalizedEnvSha.toLowerCase() !== 'unknown') {
            return { gitSha: normalizedEnvSha, resolvedFrom: 'env' };
        }
    }

    try {
        const gitSha = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
        return { gitSha, resolvedFrom: 'git' };
    } catch (error) {
        return { gitSha: 'unknown', resolvedFrom: 'unknown' };
    }
};

const writeBuildMeta = async ({ gitSha, resolvedFrom }) => {
    const payload = {
        gitSha,
        generatedAt: new Date().toISOString(),
        source: 'build-meta',
        resolvedFrom,
    };
    await fs.mkdir(path.dirname(buildMetaPath), { recursive: true });
    await fs.writeFile(buildMetaPath, `${JSON.stringify(payload, null, 4)}\n`);
};

const run = (command, args, options = {}) => {
    const result = spawnSync(command, args, {
        stdio: 'inherit',
        env: process.env,
        ...options,
    });

    if (result.error) {
        console.error(`Failed to run ${command}:`, result.error);
    }

    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
};

const resolvedMeta = resolveGitSha();
process.env.VITE_GIT_SHA = resolvedMeta.gitSha;
try {
    await writeBuildMeta(resolvedMeta);
} catch (error) {
    console.error(
        'Failed to write build metadata to frontend/src/generated/build_meta.json',
        error
    );
    process.exit(1);
}

run('npm', ['run', 'build:docs-rag']);
run('npm', ['--prefix', 'frontend', 'run', 'build']);
run('node', ['scripts/verify-build-stamp.mjs']);
