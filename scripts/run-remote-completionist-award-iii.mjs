#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..');
const frontendDir = join(repoRoot, 'frontend');

const DEFAULT_BASE_URL = 'http://127.0.0.1:4173';
const PLAYWRIGHT_CLI_RELATIVE_PATH = './node_modules/@playwright/test/cli.js';
const PLAYWRIGHT_CLI_PATH = join(frontendDir, 'node_modules', '@playwright', 'test', 'cli.js');

function parseArgs(argv) {
  const parsed = {
    baseURL: DEFAULT_BASE_URL,
    project: 'chromium',
    passthrough: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '--baseURL' || arg === '--base-url') {
      parsed.baseURL = argv[index + 1] || parsed.baseURL;
      index += 1;
      continue;
    }

    if (arg.startsWith('--baseURL=') || arg.startsWith('--base-url=')) {
      parsed.baseURL = arg.slice(arg.indexOf('=') + 1) || parsed.baseURL;
      continue;
    }

    if (arg === '--project') {
      parsed.project = argv[index + 1] || parsed.project;
      index += 1;
      continue;
    }

    if (arg.startsWith('--project=')) {
      parsed.project = arg.slice(arg.indexOf('=') + 1) || parsed.project;
      continue;
    }

    parsed.passthrough.push(arg);
  }

  return parsed;
}

function printChecklistSummary(reportPath) {
  const absolutePath = join(frontendDir, reportPath);
  if (!existsSync(absolutePath)) {
    console.warn(`[qa:remote-completionist-award-iii] No harness report found at ${absolutePath}`);
    return;
  }

  try {
    const raw = readFileSync(absolutePath, 'utf8');
    const report = JSON.parse(raw);
    const rows = Array.isArray(report.results) ? report.results : [];
    const passed = rows.filter((row) => row.status === 'pass').length;
    const failed = rows.filter((row) => row.status === 'fail').length;
    const manual = rows.filter((row) => row.status === 'manual').length;

    console.log('\n[qa:remote-completionist-award-iii] Checklist summary');
    console.log(`  pass=${passed} fail=${failed} manual=${manual}`);

    for (const row of rows) {
      const marker = row.status === 'pass' ? '✅' : row.status === 'fail' ? '❌' : '🧭';
      const detail = row.detail ? ` — ${row.detail}` : '';
      console.log(`  ${marker} ${row.id}: ${row.label}${detail}`);
    }
  } catch (error) {
    console.warn(
      `[qa:remote-completionist-award-iii] Failed to parse harness report: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function isNodeVersionSupported(version = process.versions.node) {
  const [major = '0', minor = '0'] = String(version).split('.');
  const majorNumber = Number.parseInt(major, 10);
  const minorNumber = Number.parseInt(minor, 10);

  if (!Number.isFinite(majorNumber) || !Number.isFinite(minorNumber)) {
    return false;
  }

  if (majorNumber < 20 || majorNumber >= 22) {
    return false;
  }

  return minorNumber >= 0;
}

function printEnvironmentHelpAndExit() {
  const nodeVersion = process.versions.node;
  const nodeSupported = isNodeVersionSupported(nodeVersion);
  const playwrightInstalled = existsSync(PLAYWRIGHT_CLI_PATH);
  const problems = [];

  if (!nodeSupported) {
    problems.push(`Node.js ${nodeVersion} is not supported (required: >=20 <22).`);
  }

  if (!playwrightInstalled) {
    problems.push(`Playwright CLI not found at ${PLAYWRIGHT_CLI_PATH}.`);
  }

  if (problems.length === 0) {
    return;
  }

  console.error('[qa:remote-completionist-award-iii] Environment check failed:');
  for (const problem of problems) {
    console.error(`  - ${problem}`);
  }
  console.error('Suggested fix:');
  console.error('  1) Switch to Node 20 LTS (repo requires >=20 <22).');
  console.error('  2) Install dependencies from repo root: pnpm install (or npm run ci:install).');
  console.error('  3) Install browser binaries if needed: npx playwright install chromium.');
  process.exit(1);
}

const options = parseArgs(process.argv.slice(2));
printEnvironmentHelpAndExit();

if (!/^https?:\/\//i.test(options.baseURL)) {
  console.error(`Invalid --baseURL value: "${options.baseURL}". Include http:// or https://.`);
  process.exit(1);
}

const url = new URL(options.baseURL);
const isLocalHost =
  url.hostname === '127.0.0.1' ||
  url.hostname === 'localhost' ||
  url.hostname === '0.0.0.0' ||
  url.hostname === '::1' ||
  url.hostname.endsWith('.local');

const env = {
  ...process.env,
  BASE_URL: options.baseURL,
  PLAYWRIGHT_SKIP_INSTALL_DEPS: '1',
  REMOTE_COMPLETIONIST_AWARD_III: '1',
  REMOTE_COMPLETIONIST_AWARD_III_USE_WEBSERVER: isLocalHost ? '1' : '0',
};

const playwrightArgs = [
  PLAYWRIGHT_CLI_RELATIVE_PATH,
  'test',
  'e2e/remote-completionist-award-iii.spec.ts',
  `--project=${options.project}`,
  ...options.passthrough,
];

console.log(`[qa:remote-completionist-award-iii] baseURL=${options.baseURL}`);
console.log(`[qa:remote-completionist-award-iii] project=${options.project}`);
console.log(
  `[qa:remote-completionist-award-iii] webServer=${env.REMOTE_COMPLETIONIST_AWARD_III_USE_WEBSERVER === '1' ? 'managed by Playwright (local)' : 'disabled (remote target)'}`
);

const child = spawn('node', playwrightArgs, {
  cwd: frontendDir,
  stdio: 'inherit',
  env,
});

child.on('error', (err) => {
  console.error(
    `[qa:remote-completionist-award-iii] Failed to start Playwright process: ${err.message}`
  );
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  printChecklistSummary('test-results/remote-completionist-award-iii-harness-report.json');
  process.exit(code ?? 1);
});
