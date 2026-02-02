import { execSync, spawnSync } from 'node:child_process';

const resolveGitSha = () => {
    const envSha =
        process.env.VITE_GIT_SHA || process.env.DSPACE_GIT_SHA || process.env.GIT_SHA;
    if (envSha && envSha.trim()) {
        return envSha.trim();
    }

    try {
        return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    } catch (error) {
        return 'unknown';
    }
};

const run = (command, args, options = {}) => {
    const result = spawnSync(command, args, {
        stdio: 'inherit',
        env: process.env,
        ...options,
    });

    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
};

process.env.VITE_GIT_SHA = resolveGitSha();

run('npm', ['run', 'build:docs-rag']);
run('npm', ['--prefix', 'frontend', 'run', 'build']);
