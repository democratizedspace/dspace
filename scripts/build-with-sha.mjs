import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
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
        return { sha: 'unknown', source: 'unknown' };
    }
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

const resolvedGit = resolveGitSha();

process.env.VITE_GIT_SHA = resolvedGit.sha;

const buildMetaPayload = {
    gitSha: resolvedGit.sha,
    generatedAt: new Date().toISOString(),
    source: resolvedGit.source,
};

fs.writeFileSync(buildMetaPath, `${JSON.stringify(buildMetaPayload, null, 4)}\n`, 'utf-8');

run('npm', ['run', 'build:docs-rag']);
run('npm', ['--prefix', 'frontend', 'run', 'build']);
