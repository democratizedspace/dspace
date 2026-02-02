import { execSync } from 'node:child_process';

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

const gitSha = resolveGitSha();
const env = {
    ...process.env,
    VITE_GIT_SHA: gitSha,
    DSPACE_GIT_SHA: gitSha,
    GIT_SHA: process.env.GIT_SHA || gitSha,
};

execSync('npm run build:docs-rag', { stdio: 'inherit', env });
execSync('npm run build:frontend', { stdio: 'inherit', env });
