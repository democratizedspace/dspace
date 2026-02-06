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
            return { sha: normalizedEnvSha, source: 'ci' };
        }
    }

    try {
        return {
            sha: execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim(),
            source: 'git',
        };
    } catch (error) {
        return { sha: 'missing', source: 'unknown' };
    }
};

const writeBuildMeta = async ({ sha, source }) => {
    const payload = {
        gitSha: sha,
        generatedAt: new Date().toISOString(),
        source,
    };
    await fs.mkdir(path.dirname(buildMetaPath), { recursive: true });
    const formatted = `${JSON.stringify(payload, null, 4)}\n`;
    await fs.writeFile(buildMetaPath, formatted, 'utf-8');
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

const resolvedBuildInfo = resolveGitSha();
if (resolvedBuildInfo.sha && resolvedBuildInfo.sha !== 'missing') {
    process.env.VITE_GIT_SHA = resolvedBuildInfo.sha;
}
await writeBuildMeta(resolvedBuildInfo);

run('npm', ['run', 'build:docs-rag']);
run('npm', ['--prefix', 'frontend', 'run', 'build']);
