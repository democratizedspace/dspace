#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = process.cwd();
const frontendDir = join(rootDir, 'frontend');
const resultsDir = join(rootDir, 'test-results', 'remote-smoke');
const jsonReportPath = join(resultsDir, 'playwright-report.json');
const summaryJsonPath = join(resultsDir, 'summary.json');
const summaryMdPath = join(resultsDir, 'summary.md');

mkdirSync(resultsDir, { recursive: true });

function parseArgs(argv) {
  const passthrough = [];
  let baseURL = process.env.BASE_URL || '';

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '--baseURL' || arg === '--base-url') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error(`${arg} requires a value`);
      }
      baseURL = value;
      index += 1;
      continue;
    }

    if (arg.startsWith('--baseURL=')) {
      baseURL = arg.split('=')[1] || '';
      continue;
    }

    if (arg.startsWith('--base-url=')) {
      baseURL = arg.split('=')[1] || '';
      continue;
    }

    passthrough.push(arg);
  }

  return { baseURL, passthrough };
}

function collectStats(
  suite,
  stats = { total: 0, passed: 0, failed: 0, skipped: 0, timedOut: 0 }
) {
  if (Array.isArray(suite?.specs)) {
    for (const spec of suite.specs) {
      if (!Array.isArray(spec.tests)) {
        continue;
      }

      for (const test of spec.tests) {
        const result = Array.isArray(test.results)
          ? test.results.at(-1)
          : undefined;
        const status = result?.status || 'unknown';
        stats.total += 1;
        if (status === 'passed') {
          stats.passed += 1;
        } else if (status === 'failed') {
          stats.failed += 1;
        } else if (status === 'skipped') {
          stats.skipped += 1;
        } else if (status === 'timedOut') {
          stats.timedOut += 1;
        }
      }
    }
  }

  if (Array.isArray(suite?.suites)) {
    for (const nested of suite.suites) {
      collectStats(nested, stats);
    }
  }

  return stats;
}

function writeSummary(exitCode, baseURL, startTimeIso, endTimeIso) {
  const jsonRaw = readFileSync(jsonReportPath, 'utf8');
  const report = JSON.parse(jsonRaw);
  const stats = collectStats(report);

  const summary = {
    status: exitCode === 0 ? 'passed' : 'failed',
    baseURL,
    chatMode: process.env.REMOTE_CHAT_MODE || 'ui',
    startedAt: startTimeIso,
    finishedAt: endTimeIso,
    stats,
  };

  writeFileSync(
    summaryJsonPath,
    `${JSON.stringify(summary, null, 2)}\n`,
    'utf8'
  );

  const markdown = [
    '# Remote smoke summary',
    '',
    `- Status: **${summary.status.toUpperCase()}**`,
    `- Base URL: ${summary.baseURL || '(default from Playwright config)'}`,
    `- Chat mode: ${summary.chatMode}`,
    `- Started: ${summary.startedAt}`,
    `- Finished: ${summary.finishedAt}`,
    `- Tests: ${stats.passed}/${stats.total} passed` +
      (stats.failed ? `, ${stats.failed} failed` : '') +
      (stats.skipped ? `, ${stats.skipped} skipped` : '') +
      (stats.timedOut ? `, ${stats.timedOut} timed out` : ''),
    '',
    `- JSON report: \`${jsonReportPath}\``,
    `- Summary JSON: \`${summaryJsonPath}\``,
  ].join('\n');

  writeFileSync(summaryMdPath, `${markdown}\n`, 'utf8');
  console.log('\n' + markdown + '\n');
}

const { baseURL, passthrough } = parseArgs(process.argv.slice(2));

const env = {
  ...process.env,
  REMOTE_SMOKE_REPORT_FILE: jsonReportPath,
  PLAYWRIGHT_SKIP_INSTALL_DEPS: process.env.PLAYWRIGHT_SKIP_INSTALL_DEPS || '1',
  ...(baseURL ? { BASE_URL: baseURL } : {}),
};

const startTimeIso = new Date().toISOString();

const setupResult = spawnSync('npm', ['run', 'setup-test-env'], {
  cwd: frontendDir,
  stdio: 'inherit',
  env,
});
if (setupResult.status !== 0) {
  process.exit(setupResult.status ?? 1);
}

const args = [
  './node_modules/@playwright/test/cli.js',
  'test',
  '--config=playwright.remote.config.ts',
  ...passthrough,
];

const testResult = spawnSync('node', args, {
  cwd: frontendDir,
  stdio: 'inherit',
  env,
});

const endTimeIso = new Date().toISOString();

try {
  writeSummary(
    testResult.status ?? 1,
    baseURL || env.BASE_URL || '',
    startTimeIso,
    endTimeIso
  );
} catch (error) {
  console.warn('Unable to write remote smoke summary:', error);
}

process.exit(testResult.status ?? 1);
