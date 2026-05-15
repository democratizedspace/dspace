import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withKnownNodeWarningFilter } from '../../scripts/node-warning-filter-env.mjs';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(command, args, options = {}) {
    const result = spawnSync(command, args, {
        cwd: frontendRoot,
        stdio: 'inherit',
        shell: process.platform === 'win32',
        ...options,
    });

    if (result.error) {
        console.error(`Failed to run ${command}:`, result.error);
        process.exit(1);
    }

    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

run(process.execPath, ['scripts/a11y-lint.mjs']);

const eslintEnv = withKnownNodeWarningFilter(process.env);
eslintEnv.NODE_OPTIONS = `${eslintEnv.NODE_OPTIONS} --disable-warning=ESLintRCWarning`;

run(process.execPath, ['./node_modules/eslint/bin/eslint.js', '.', '--max-warnings=0'], {
    env: {
        ...eslintEnv,
        ESLINT_USE_FLAT_CONFIG: 'false',
    },
});
