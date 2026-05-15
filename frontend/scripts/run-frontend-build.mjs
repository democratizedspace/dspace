import { runFilteredCommand } from './utils/run-filtered-command.mjs';

try {
    await runFilteredCommand(process.execPath, ['scripts/build-processes.mjs'], {
        filterOutput: false,
        label: 'build processes',
    });
    await runFilteredCommand(process.execPath, ['scripts/run-astro-build.mjs'], {
        label: 'astro build',
    });
} catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(
        error && typeof error === 'object' && 'code' in error ? Number(error.code) || 1 : 1
    );
}
