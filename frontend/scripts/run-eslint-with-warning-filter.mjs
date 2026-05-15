#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import nodeWarningFilter from '../../scripts/node-warning-filter.cjs';

const { addNodeWarningFilterToEnv } = nodeWarningFilter;

const eslintCommand = process.platform === 'win32' ? 'eslint.cmd' : 'eslint';
const frontendDir = fileURLToPath(new URL('..', import.meta.url));
const nodeOptions = ['--disable-warning=ESLintRCWarning', process.env.NODE_OPTIONS || '']
    .join(' ')
    .trim();

const result = spawnSync(eslintCommand, process.argv.slice(2), {
    cwd: frontendDir,
    env: addNodeWarningFilterToEnv({
        ...process.env,
        ESLINT_USE_FLAT_CONFIG: 'false',
        NODE_OPTIONS: nodeOptions,
    }),
    stdio: 'inherit',
});

if (result.error) {
    console.error('Failed to run ESLint with the Node warning filter:', result.error);
    process.exit(1);
}

if (result.signal) {
    process.kill(process.pid, result.signal);
}

process.exit(result.status ?? 1);
