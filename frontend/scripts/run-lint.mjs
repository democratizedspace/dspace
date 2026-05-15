import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendNodeOptions, runFilteredCommand } from './utils/run-filtered-command.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');
const eslintCli = path.join(frontendRoot, 'node_modules', 'eslint', 'bin', 'eslint.js');
const fix = process.argv.includes('--fix');

try {
    await runFilteredCommand(process.execPath, ['scripts/a11y-lint.mjs'], {
        cwd: frontendRoot,
        label: 'a11y lint',
    });

    await runFilteredCommand(
        process.execPath,
        [eslintCli, '.', ...(fix ? ['--fix'] : ['--max-warnings=0'])],
        {
            cwd: frontendRoot,
            env: appendNodeOptions(
                {
                    ...process.env,
                    ESLINT_USE_FLAT_CONFIG: 'false',
                },
                '--disable-warning=ESLintRCWarning'
            ),
            label: fix ? 'eslint --fix' : 'eslint',
        }
    );
} catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(
        error && typeof error === 'object' && 'code' in error ? Number(error.code) || 1 : 1
    );
}
