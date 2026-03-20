#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..');
const frontendDir = join(repoRoot, 'frontend');

const DEFAULT_BASE_URL = 'http://127.0.0.1:4173';
const REPORT_PATH = join(
  frontendDir,
  'test-results',
  'remote-migration-report.json'
);

function parseArgs(argv) {
  const parsed = {
    baseURL: DEFAULT_BASE_URL,
    project: 'chromium',
    realV2SavePath: process.env.QA_REMOTE_V2_SAVE_PATH || '',
    realV2Json: process.env.QA_REMOTE_V2_SAVE_JSON || '',
    passthrough: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--baseURL' || arg === '--base-url') {
      parsed.baseURL = argv[index + 1] || parsed.baseURL;
      index += 1;
      continue;
    }

    if (arg.startsWith('--baseURL=')) {
      parsed.baseURL = arg.slice(arg.indexOf('=') + 1) || parsed.baseURL;
      continue;
    }

    if (arg.startsWith('--base-url=')) {
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

    if (arg === '--real-v2-save' || arg === '--real-v2-json-path') {
      parsed.realV2SavePath = argv[index + 1] || parsed.realV2SavePath;
      index += 1;
      continue;
    }

    if (arg.startsWith('--real-v2-save=')) {
      parsed.realV2SavePath =
        arg.slice(arg.indexOf('=') + 1) || parsed.realV2SavePath;
      continue;
    }

    if (arg.startsWith('--real-v2-json-path=')) {
      parsed.realV2SavePath =
        arg.slice(arg.indexOf('=') + 1) || parsed.realV2SavePath;
      continue;
    }

    if (arg === '--real-v2-json') {
      parsed.realV2Json = argv[index + 1] || parsed.realV2Json;
      index += 1;
      continue;
    }

    if (arg.startsWith('--real-v2-json=')) {
      parsed.realV2Json = arg.slice(arg.indexOf('=') + 1) || parsed.realV2Json;
      continue;
    }

    parsed.passthrough.push(arg);
  }

  return parsed;
}

function readRealV2Json(options) {
  if (options.realV2Json) {
    try {
      return JSON.stringify(JSON.parse(options.realV2Json));
    } catch (error) {
      console.error(
        '[qa:remote-migration] --real-v2-json is not valid JSON:',
        error.message
      );
      process.exit(1);
    }
  }

  if (options.realV2SavePath) {
    const absolutePath = resolve(process.cwd(), options.realV2SavePath);
    if (!existsSync(absolutePath)) {
      console.error(
        `[qa:remote-migration] Real save file not found: ${absolutePath}`
      );
      process.exit(1);
    }

    try {
      const payload = JSON.parse(readFileSync(absolutePath, 'utf8'));
      const state =
        payload && typeof payload === 'object' && 'gameState' in payload
          ? payload.gameState
          : payload;
      return JSON.stringify(state);
    } catch (error) {
      console.error(
        `[qa:remote-migration] Could not parse real save file ${absolutePath}: ${error.message}`
      );
      process.exit(1);
    }
  }

  return '';
}

function printConciseReport(report) {
  if (!report || typeof report !== 'object') {
    console.log('[qa:remote-migration] No report payload was produced.');
    return;
  }

  const checks = Array.isArray(report.checks) ? report.checks : [];
  const passed = checks.filter((entry) => entry.status === 'pass').length;
  const failed = checks.filter((entry) => entry.status === 'fail').length;

  console.log('\n[qa:remote-migration] Checklist summary');
  console.log(`  Target: ${report.baseURL || 'unknown'}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);

  checks.forEach((entry) => {
    const icon = entry.status === 'pass' ? '✅' : '❌';
    const area = entry.area ? ` [${entry.area}]` : '';
    const note = entry.note ? ` — ${entry.note}` : '';
    console.log(`  ${icon} ${entry.id}${area}${note}`);
  });

  if (Array.isArray(report.manualOnly) && report.manualOnly.length > 0) {
    console.log('\n[qa:remote-migration] Still manual');
    report.manualOnly.forEach((item) => {
      console.log(`  • ${item}`);
    });
  }
}

const options = parseArgs(process.argv.slice(2));

if (!/^https?:\/\//i.test(options.baseURL)) {
  console.error(
    `[qa:remote-migration] Invalid --baseURL value: "${options.baseURL}". Include http:// or https://.`
  );
  process.exit(1);
}

const url = new URL(options.baseURL);
const isLocalHost =
  url.hostname === '127.0.0.1' ||
  url.hostname === 'localhost' ||
  url.hostname === '0.0.0.0' ||
  url.hostname === '::1' ||
  url.hostname.endsWith('.local');

const realV2Json = readRealV2Json(options);

const env = {
  ...process.env,
  BASE_URL: options.baseURL,
  PLAYWRIGHT_SKIP_INSTALL_DEPS: '1',
  REMOTE_MIGRATION: '1',
  REMOTE_MIGRATION_USE_WEBSERVER: isLocalHost ? '1' : '0',
  REMOTE_MIGRATION_REAL_V2_JSON: realV2Json,
};

const playwrightArgs = [
  './node_modules/@playwright/test/cli.js',
  'test',
  'e2e/remote-legacy-migration.spec.ts',
  `--project=${options.project}`,
  ...options.passthrough,
];

console.log(`[qa:remote-migration] baseURL=${options.baseURL}`);
console.log(`[qa:remote-migration] project=${options.project}`);
console.log(
  `[qa:remote-migration] webServer=${env.REMOTE_MIGRATION_USE_WEBSERVER === '1' ? 'managed by Playwright (local)' : 'disabled (remote target)'}`
);
console.log(
  `[qa:remote-migration] realSave=${realV2Json ? 'provided (will run extra real-v2 scenario)' : 'not provided (fixtures only)'}`
);

const child = spawn('node', playwrightArgs, {
  cwd: frontendDir,
  stdio: 'inherit',
  env,
});

child.on('error', (err) => {
  console.error(
    `[qa:remote-migration] Failed to start Playwright process: ${err.message}`
  );
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (existsSync(REPORT_PATH)) {
    try {
      const report = JSON.parse(readFileSync(REPORT_PATH, 'utf8'));
      printConciseReport(report);
    } catch (error) {
      console.warn(
        `[qa:remote-migration] Could not parse concise report: ${error.message}`
      );
    }
  }

  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
