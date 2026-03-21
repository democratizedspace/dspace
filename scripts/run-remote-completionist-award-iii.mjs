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

const DEFAULT_BASE_URL = 'http://127.0.0.1:4173';
const SUPPORTED_NODE_RANGE = '>=20 <22';

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
  const [major = 0] = String(version).split('.').map((segment) => Number.parseInt(segment, 10));
  return Number.isInteger(major) && major >= 20 && major < 22;
}

export function getUnsupportedNodeVersionMessage(version = process.versions.node) {
  return (
    `[qa:remote-completionist-award-iii] Unsupported Node.js version ${version}. ` +
    `Supported range: ${SUPPORTED_NODE_RANGE}. ` +
    'Run `nvm use` and reinstall dependencies with `pnpm install`.'
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

export function main(
  argv = process.argv.slice(2),
  {
    nodeVersion = process.versions.node,
    spawnFn = spawn,
    resolvePlaywrightCliFn = resolvePlaywrightCli,
    envSource = process.env,
    logFn = console.log,
    warnFn = console.warn,
    errorFn = console.error,
    exitFn = (code) => process.exit(code),
  } = {}
) {
  const options = parseArgs(argv);

  if (!/^https?:\/\//i.test(options.baseURL)) {
    errorFn(`Invalid --baseURL value: "${options.baseURL}". Include http:// or https://.`);
    exitFn(1);
    return;
  }

  if (!isSupportedNodeVersion(nodeVersion)) {
    errorFn(getUnsupportedNodeVersionMessage(nodeVersion));
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
    ...envSource,
    BASE_URL: options.baseURL,
    PLAYWRIGHT_SKIP_INSTALL_DEPS: '1',
    REMOTE_COMPLETIONIST_AWARD_III: '1',
    REMOTE_COMPLETIONIST_AWARD_III_USE_WEBSERVER: isLocalHost ? '1' : '0',
  };

  const playwrightCli = resolvePlaywrightCliFn();

  if (!playwrightCli) {
    errorFn(
      '[qa:remote-completionist-award-iii] Could not resolve @playwright/test/cli. ' +
        'Install dependencies with Node 20 (for example: `nvm use && pnpm install`).'
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

  logFn(`[qa:remote-completionist-award-iii] baseURL=${options.baseURL}`);
  logFn(`[qa:remote-completionist-award-iii] project=${options.project}`);
  logFn(
    `[qa:remote-completionist-award-iii] webServer=${env.REMOTE_COMPLETIONIST_AWARD_III_USE_WEBSERVER === '1' ? 'managed by Playwright (local)' : 'disabled (remote target)'}`
  );

  const child = spawnFn('node', playwrightArgs, {
    cwd: frontendDir,
    stdio: 'inherit',
    env,
  });

  child.on('error', (err) => {
    errorFn(
      `[qa:remote-completionist-award-iii] Failed to start Playwright process: ${err.message}`
    );
    exitFn(1);
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    if (warnFn !== console.warn) {
      const originalWarn = console.warn;
      console.warn = warnFn;
      try {
        printChecklistSummary('test-results/remote-completionist-award-iii-harness-report.json');
      } finally {
        console.warn = originalWarn;
      }
    } else {
      printChecklistSummary('test-results/remote-completionist-award-iii-harness-report.json');
    }
    exitFn(code ?? 1);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
