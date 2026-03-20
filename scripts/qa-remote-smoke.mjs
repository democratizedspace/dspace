#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const frontendDir = path.join(repoRoot, 'frontend');
const outputDir = path.join(frontendDir, 'test-results', 'remote-smoke');
const jsonReportPath = path.join(outputDir, 'results.json');
const markdownSummaryPath = path.join(outputDir, 'summary.md');

mkdirSync(outputDir, { recursive: true });

const PRESET_BASE_URLS = {
  staging: 'https://staging.democratized.space',
  'alias-prod': 'https://prod.democratized.space',
  'apex-prod': 'https://democratized.space',
};

const args = process.argv.slice(2);
const passthrough = [];
let baseURL = process.env.BASE_URL || '';
let target = '';
let chatMode = process.env.REMOTE_SMOKE_CHAT_MODE || 'ui';
let chatPrompt = process.env.REMOTE_SMOKE_CHAT_PROMPT || '';

for (let index = 0; index < args.length; index++) {
  const arg = args[index];

  if (arg === '--') {
    continue;
  }

  if (arg === '--baseURL' && args[index + 1]) {
    baseURL = args[index + 1];
    index++;
    continue;
  }

  if (arg.startsWith('--baseURL=')) {
    baseURL = arg.split('=')[1] || baseURL;
    continue;
  }

  if (arg === '--target' && args[index + 1]) {
    target = args[index + 1];
    index++;
    continue;
  }

  if (arg.startsWith('--target=')) {
    target = arg.split('=')[1] || target;
    continue;
  }

  if (arg === '--chat-mode' && args[index + 1]) {
    chatMode = args[index + 1];
    index++;
    continue;
  }

  if (arg.startsWith('--chat-mode=')) {
    chatMode = arg.split('=')[1] || chatMode;
    continue;
  }

  if (arg === '--chat-prompt' && args[index + 1]) {
    chatPrompt = args[index + 1];
    index++;
    continue;
  }

  if (arg.startsWith('--chat-prompt=')) {
    chatPrompt = arg.slice('--chat-prompt='.length) || chatPrompt;
    continue;
  }

  passthrough.push(arg);
}

if (target) {
  const resolvedTarget = PRESET_BASE_URLS[target];
  if (!resolvedTarget) {
    console.error(
      `Unknown --target "${target}". Use one of: ${Object.keys(PRESET_BASE_URLS).join(', ')}`
    );
    process.exit(1);
  }
  baseURL = resolvedTarget;
}

if (!baseURL) {
  baseURL = 'http://127.0.0.1:4173';
}

chatMode = chatMode === 'live' ? 'live' : 'ui';

const env = {
  ...process.env,
  BASE_URL: baseURL,
  REMOTE_SMOKE_CHAT_MODE: chatMode,
  REMOTE_SMOKE_JSON_REPORT: jsonReportPath,
};

if (chatPrompt) {
  env.REMOTE_SMOKE_CHAT_PROMPT = chatPrompt;
}

console.log(`Running remote smoke against ${baseURL}`);
console.log(`Chat mode: ${chatMode}`);

const cliPath = path.join(
  frontendDir,
  'node_modules',
  '@playwright',
  'test',
  'cli.js'
);
const commandArgs = [
  cliPath,
  'test',
  '--config',
  'playwright.remote.config.ts',
  'e2e/remote-release-smoke.spec.ts',
  ...passthrough,
];

const run = spawnSync(process.execPath, commandArgs, {
  cwd: frontendDir,
  stdio: 'inherit',
  env,
});

const status = run.status ?? 1;

const summary = {
  generatedAt: new Date().toISOString(),
  baseURL,
  target: target || null,
  chatMode,
  status,
  stats: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    timedOut: 0,
  },
  failedTests: [],
};

try {
  const jsonReport = JSON.parse(readFileSync(jsonReportPath, 'utf8'));
  const stats = jsonReport.stats ?? {};

  summary.stats.total = stats.expected ?? stats.total ?? 0;
  summary.stats.passed =
    stats.expected - (stats.unexpected ?? 0) - (stats.skipped ?? 0);
  summary.stats.failed = stats.unexpected ?? 0;
  summary.stats.skipped = stats.skipped ?? 0;
  summary.stats.timedOut = stats.flaky ?? 0;

  const failedTests = [];
  for (const suite of jsonReport.suites ?? []) {
    const stack = [suite];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) {
        continue;
      }

      for (const child of current.suites ?? []) {
        stack.push(child);
      }

      for (const spec of current.specs ?? []) {
        const hasFailure = (spec.tests ?? []).some((candidate) =>
          (candidate.results ?? []).some((result) => result.status === 'failed')
        );
        if (!hasFailure) {
          continue;
        }

        const titlePath = [...(spec.titlePath ?? []), spec.title].filter(
          Boolean
        );
        failedTests.push(titlePath.join(' › '));
      }
    }
  }

  summary.failedTests = failedTests;
} catch (error) {
  console.warn('Could not parse remote smoke JSON report:', error);
}

const markdownLines = [
  '# Remote Smoke Summary',
  '',
  `- Generated: ${summary.generatedAt}`,
  `- Base URL: ${summary.baseURL}`,
  `- Target preset: ${summary.target ?? 'custom'}`,
  `- Chat mode: ${summary.chatMode}`,
  `- Exit status: ${summary.status}`,
  '',
  '## Totals',
  '',
  `- Total: ${summary.stats.total}`,
  `- Passed: ${summary.stats.passed}`,
  `- Failed: ${summary.stats.failed}`,
  `- Skipped: ${summary.stats.skipped}`,
  `- Timed out/flaky count: ${summary.stats.timedOut}`,
  '',
  '## Failed tests',
  '',
];

if (summary.failedTests.length === 0) {
  markdownLines.push('- None');
} else {
  for (const failedTest of summary.failedTests) {
    markdownLines.push(`- ${failedTest}`);
  }
}

writeFileSync(markdownSummaryPath, `${markdownLines.join('\n')}\n`, 'utf8');
console.log(
  `Remote smoke markdown summary written to ${path.relative(repoRoot, markdownSummaryPath)}`
);

process.exit(status);
