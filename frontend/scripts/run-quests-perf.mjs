import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');
const playwrightCli = path.join(frontendDir, 'node_modules', '@playwright', 'test', 'cli.js');

if (!fs.existsSync(playwrightCli)) {
    console.error('Playwright CLI not found. Run npm install in frontend first.');
    process.exit(1);
}

const cpuSlowdownFromEnv = Number(process.env.QUESTS_TTI_CPU_SLOWDOWN ?? '1');
const hasSlowCpuFlag = process.argv.includes('--slowcpu');
const cpuSlowdown =
    Number.isFinite(cpuSlowdownFromEnv) && cpuSlowdownFromEnv > 0
        ? cpuSlowdownFromEnv
        : hasSlowCpuFlag
          ? 4
          : 1;

const env = {
    ...process.env,
    QUESTS_TTI_CPU_SLOWDOWN: String(cpuSlowdown),
};

const args = [
    playwrightCli,
    'test',
    'e2e/quests-tti-metrics.spec.ts',
    '--project=chromium',
    '--workers=1',
    '--reporter=line',
];

console.log(`[quests-perf] Running with QUESTS_TTI_CPU_SLOWDOWN=${cpuSlowdown}`);

const result = spawnSync(process.execPath, args, {
    cwd: frontendDir,
    env,
    encoding: 'utf8',
});

if (result.stdout) {
    process.stdout.write(result.stdout);
}
if (result.stderr) {
    process.stderr.write(result.stderr);
}

const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
const metricsLine = output
    .split(/\r?\n/)
    .find((line) => line.trimStart().startsWith('QUESTS_TTI_METRICS '));

if (metricsLine) {
    const jsonPayload = metricsLine.trimStart().replace('QUESTS_TTI_METRICS ', '');

    try {
        const parsed = JSON.parse(jsonPayload);
        const format = (value) => `${Math.round(value * 100) / 100}ms`;
        const measures = Array.isArray(parsed?.measures) ? parsed.measures : [];

        console.log('\n[quests-perf] Summary');
        for (const entry of measures) {
            console.log(`- ${entry.name}: ${format(entry.duration)}`);
        }
    } catch (error) {
        console.warn('[quests-perf] Unable to parse metrics payload as JSON:', error);
    }
} else {
    console.warn('[quests-perf] Metrics payload not found in Playwright output.');
}

if (result.status !== 0) {
    process.exit(result.status ?? 1);
}
