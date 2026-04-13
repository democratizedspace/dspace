#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const baseEnv = { ...process.env };
const requestedBaseUrl = (baseEnv.QUESTS_PERF_BASE_URL || '').trim();

if (requestedBaseUrl) {
    baseEnv.BASE_URL = requestedBaseUrl;
    baseEnv.REMOTE_SMOKE = '1';
}

// QUESTS_TTI_CPU_SLOWDOWN is forwarded automatically via baseEnv = { ...process.env }.

const result = spawnSync(
    'playwright',
    ['test', 'e2e/quests-tti-metrics.spec.ts', '--project=chromium'],
    {
        cwd: new URL('..', import.meta.url),
        stdio: 'inherit',
        env: baseEnv,
        shell: true,
    }
);

if (typeof result.status === 'number') {
    process.exit(result.status);
}

process.exit(1);
