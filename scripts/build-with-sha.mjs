import { spawnSync } from 'node:child_process';
import { resolveGitSha, writeBuildMeta } from './write-build-meta.mjs';

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
process.env.EXPECTED_SHA = resolvedMeta.gitSha;
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
run('node', ['scripts/verify-build-sha.mjs', 'frontend/dist']);
