import { spawnSync } from 'node:child_process';
import {
    assertBuildMetaComplete,
    readBuildMeta,
    resolveBuildMeta,
    writeBuildMeta,
} from './write-build-meta.mjs';

const UNSUPPORTED_PAGES_FILE_WARNING =
    /\[WARN\] Unsupported file type .* Prefix filename with an underscore \(`_`\) to ignore\./;

const run = (command, args, options = {}) => {
    const { suppressAstroUnsupportedFileWarnings = false, ...spawnOptions } = options;
    const defaultStdio = suppressAstroUnsupportedFileWarnings ? 'pipe' : 'inherit';
    const result = spawnSync(command, args, {
        stdio: defaultStdio,
        env: process.env,
        encoding: suppressAstroUnsupportedFileWarnings ? 'utf8' : undefined,
        ...spawnOptions,
    });

    if (suppressAstroUnsupportedFileWarnings) {
        const stdout = result.stdout ?? '';
        const stderr = result.stderr ?? '';
        const combined = `${stdout}${stderr}`;
        let suppressedWarnings = 0;

        for (const line of combined.split(/\r?\n/)) {
            if (!line) {
                continue;
            }

            if (UNSUPPORTED_PAGES_FILE_WARNING.test(line)) {
                suppressedWarnings += 1;
                continue;
            }

            console.log(line);
        }

        if (suppressedWarnings > 0) {
            console.log(
                `[build] Suppressed ${suppressedWarnings} Astro unsupported-file warnings under frontend/src/pages.`
            );
        }
    }

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
run('npm', ['--prefix', 'frontend', 'run', 'build'], {
    suppressAstroUnsupportedFileWarnings: true,
});
