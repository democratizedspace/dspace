import { spawnSync } from 'node:child_process';
import {
    assertBuildMetaComplete,
    readBuildMeta,
    resolveBuildMeta,
    writeBuildMeta,
} from './write-build-meta.mjs';

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

const { gitSha, source } = resolveBuildMeta();
process.env.VITE_GIT_SHA = gitSha;
try {
    await writeBuildMeta({ gitSha, source });
    const writtenMeta = await readBuildMeta();
    assertBuildMetaComplete(writtenMeta);
} catch (error) {
    console.error(
        'Failed to write build metadata to frontend/src/generated/build_meta.json',
        error
    );
    process.exit(1);
}

run('npm', ['run', 'build:docs-rag']);
run('npm', ['--prefix', 'frontend', 'run', 'build']);
