import { execSync, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const resolveGitSha = () => {
    const envSha =
        process.env.VITE_GIT_SHA || process.env.DSPACE_GIT_SHA || process.env.GIT_SHA;
    if (envSha) {
        const normalizedEnvSha = envSha.trim();
        if (normalizedEnvSha && normalizedEnvSha.toLowerCase() !== 'unknown') {
            return normalizedEnvSha;
        }
    }

    try {
        return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    } catch (error) {
        return 'dev-local';
    }
};

const resolveGitSource = (sha) => {
    if (sha && sha !== 'dev-local') {
        if (process.env.CI && process.env.CI !== 'false') {
            return 'ci';
        }
        if (process.env.VITE_GIT_SHA || process.env.DSPACE_GIT_SHA || process.env.GIT_SHA) {
            return 'git';
        }
        return 'git';
    }
    return 'unknown';
};

const writeBuildMeta = ({ gitSha, source }) => {
    const buildMetaPath = join(
        process.cwd(),
        'frontend',
        'src',
        'generated',
        'build_meta.json'
    );
    mkdirSync(dirname(buildMetaPath), { recursive: true });
    const payload = {
        gitSha,
        generatedAt: new Date().toISOString(),
        source,
    };
    writeFileSync(buildMetaPath, `${JSON.stringify(payload, null, 4)}\n`, 'utf8');
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

const resolvedSha = resolveGitSha();
process.env.VITE_GIT_SHA = resolvedSha;
writeBuildMeta({ gitSha: resolvedSha, source: resolveGitSource(resolvedSha) });

run('npm', ['run', 'build:docs-rag']);
run('npm', ['--prefix', 'frontend', 'run', 'build']);
