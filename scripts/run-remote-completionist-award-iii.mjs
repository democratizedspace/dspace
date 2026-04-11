#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..');
const frontendDir = join(repoRoot, 'frontend');
const packageJsonPath = join(repoRoot, 'package.json');

const DEFAULT_BASE_URL = 'http://127.0.0.1:4173';

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const SUPPORTED_NODE_RANGE = packageJson?.engines?.node ?? '>=20 <22';

function parseNodeMajorRangeClause(clause) {
  const comparators = String(clause)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (comparators.length === 0) {
    return null;
  }

  const checks = comparators.map((comparator) => {
    const match = /^(>=|<=|>|<)?(\d+)$/.exec(comparator);
    if (!match) {
      return null;
    }

    const operator = match[1] ?? '=';
    const major = Number(match[2]);

    return (candidateMajor) => {
      if (operator === '=') return candidateMajor === major;
      if (operator === '>=') return candidateMajor >= major;
      if (operator === '<=') return candidateMajor <= major;
      if (operator === '>') return candidateMajor > major;
      return candidateMajor < major;
    };
  });

  if (checks.some((check) => check === null)) {
    return null;
  }

  return (candidateMajor) => checks.every((check) => check(candidateMajor));
}

function parseNodeMajorRange(range) {
  const clauses = String(range)
    .split('||')
    .map((clause) => parseNodeMajorRangeClause(clause))
    .filter(Boolean);

  if (clauses.length === 0) {
    return null;
  }

  return (candidateMajor) => clauses.some((clause) => clause(candidateMajor));
}

const SUPPORTED_NODE_MAJOR_RANGE =
  parseNodeMajorRange(SUPPORTED_NODE_RANGE) ?? ((major) => major >= 20 && major < 22);

const require = createRequire(import.meta.url);

export function resolvePlaywrightCli(searchPaths = [frontendDir, repoRoot], resolveFn = require.resolve) {
  try {
    return resolveFn('@playwright/test/cli', {
      paths: searchPaths,
    });
  } catch {
    return null;
  }
}

export function isSupportedNodeVersion(version = process.versions.node) {
  const majorMatch = /^v?(\d+)\./.exec(String(version));
  if (!majorMatch) {
    return false;
  }

  const major = Number(majorMatch[1]);
  return SUPPORTED_NODE_MAJOR_RANGE(major);
}

export function getUnsupportedNodeVersionMessage(version = process.versions.node) {
  return (
    `[qa:remote-completionist-award-iii] Unsupported Node.js version ${version}. ` +
    `Required range: ${SUPPORTED_NODE_RANGE}. ` +
    'Run `nvm use` and reinstall dependencies with `pnpm install` before rerunning.'
  );
}

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

function main(runtime = {}) {
  const argv = runtime.argv ?? process.argv.slice(2);
  const nodeVersion = runtime.nodeVersion ?? process.versions.node;
  const spawnFn = runtime.spawnFn ?? spawn;
  const resolvePlaywrightCliFn = runtime.resolvePlaywrightCliFn ?? resolvePlaywrightCli;
  const exitFn = runtime.exitFn ?? ((code) => process.exit(code));
  const errorLog = runtime.errorLog ?? console.error;
  const infoLog = runtime.infoLog ?? console.log;
  const printChecklistSummaryFn = runtime.printChecklistSummaryFn ?? printChecklistSummary;

  const options = parseArgs(argv);

  if (!/^https?:\/\//i.test(options.baseURL)) {
    errorLog(`Invalid --baseURL value: "${options.baseURL}". Include http:// or https://.`);
    exitFn(1);
    return;
  }

  if (!isSupportedNodeVersion(nodeVersion)) {
    errorLog(getUnsupportedNodeVersionMessage(nodeVersion));
    exitFn(1);
    return;
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

  const playwrightCli = resolvePlaywrightCliFn();

  if (!playwrightCli) {
    errorLog(
      '[qa:remote-completionist-award-iii] Could not resolve @playwright/test/cli. ' +
        `Install dependencies with a supported Node.js version (${SUPPORTED_NODE_RANGE}; ` +
        'for example: `nvm use && pnpm install`).'
    );
    exitFn(1);
    return;
  }

  const playwrightArgs = [
    playwrightCli,
    'test',
    'e2e/remote-completionist-award-iii.spec.ts',
    `--project=${options.project}`,
    ...options.passthrough,
  ];

  infoLog(`[qa:remote-completionist-award-iii] baseURL=${options.baseURL}`);
  infoLog(`[qa:remote-completionist-award-iii] project=${options.project}`);
  infoLog(
    `[qa:remote-completionist-award-iii] webServer=${env.REMOTE_COMPLETIONIST_AWARD_III_USE_WEBSERVER === '1' ? 'managed by Playwright (local)' : 'disabled (remote target)'}`
  );

  // Keep Playwright on the same Node runtime used for this script.
  const child = spawnFn(process.execPath, playwrightArgs, {
    cwd: frontendDir,
    stdio: 'inherit',
    env,
  });

  child.on('error', (err) => {
    errorLog(`[qa:remote-completionist-award-iii] Failed to start Playwright process: ${err.message}`);
    exitFn(1);
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    printChecklistSummaryFn('test-results/remote-completionist-award-iii-harness-report.json');
    exitFn(code ?? 1);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

export { main };
