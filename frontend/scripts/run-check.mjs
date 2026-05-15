import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFilteredCommand } from './utils/run-filtered-command.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');
const prettierCli = path.join(frontendRoot, 'node_modules', 'prettier', 'bin', 'prettier.cjs');

try {
    await runFilteredCommand(process.execPath, ['scripts/run-lint.mjs'], {
        cwd: frontendRoot,
        label: 'frontend lint',
    });
    await runFilteredCommand(
        process.execPath,
        [prettierCli, '--config', '.prettierrc', '--check', '**/*.{js,ts,svelte,json,md}'],
        {
            cwd: frontendRoot,
            label: 'prettier --check',
        }
    );
} catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(
        error && typeof error === 'object' && 'code' in error ? Number(error.code) || 1 : 1
    );
}
