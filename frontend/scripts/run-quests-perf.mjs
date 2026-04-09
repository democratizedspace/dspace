#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const baseEnv = { ...process.env };
const requestedBaseUrl = (baseEnv.QUESTS_PERF_BASE_URL || '').trim();

if (requestedBaseUrl) {
    baseEnv.BASE_URL = requestedBaseUrl;
    baseEnv.REMOTE_SMOKE = '1';
}

const frontendRoot = fileURLToPath(new URL('..', import.meta.url));

const result = spawnSync(
    'playwright',
    ['test', 'e2e/quests-tti-metrics.spec.ts', '--project=chromium'],
    {
        cwd: frontendRoot,
        stdio: 'inherit',
        env: baseEnv,
        shell: true,
    }
);

if (typeof result.status === 'number') {
    process.exit(result.status);
}

process.exit(1);
