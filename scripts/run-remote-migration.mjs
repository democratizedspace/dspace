#!/usr/bin/env node

import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..');
const frontendDir = join(repoRoot, 'frontend');

const DEFAULT_BASE_URL = 'http://127.0.0.1:4173';
const DEFAULT_REPORT_PATH = join(
  frontendDir,
  'test-results',
  'remote-migration-matrix.json'
);

function parseArgs(argv) {
  const parsed = {
    baseURL: DEFAULT_BASE_URL,
    project: 'chromium',
    reportPath: DEFAULT_REPORT_PATH,
    realV2SavePath:
      process.env.REMOTE_MIGRATION_V2_SAVE_PATH ||
      process.env.LEGACY_V2_SAVE_PATH ||
      null,
    passthrough: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

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

    if (arg === '--real-v2-save' || arg === '--v2-save') {
      parsed.realV2SavePath = argv[index + 1] || parsed.realV2SavePath;
      index += 1;
      continue;
    }

    if (arg.startsWith('--real-v2-save=') || arg.startsWith('--v2-save=')) {
      parsed.realV2SavePath =
        arg.slice(arg.indexOf('=') + 1) || parsed.realV2SavePath;
      continue;
    }

    if (arg === '--report') {
      parsed.reportPath = argv[index + 1] || parsed.reportPath;
      index += 1;
      continue;
    }

    if (arg.startsWith('--report=')) {
      parsed.reportPath = arg.slice(arg.indexOf('=') + 1) || parsed.reportPath;
      continue;
    }

    parsed.passthrough.push(arg);
  }

  return parsed;
}

function loadRealV2SavePayload(pathValue) {
  if (!pathValue) {
    return null;
  }

  const absolutePath = resolve(pathValue);
  const raw = fs.readFileSync(absolutePath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Real v2 save at ${absolutePath} must be a JSON object.`);
  }

  return {
    path: absolutePath,
    payload: parsed,
  };
}

function printConciseReport(reportPath) {
  if (!fs.existsSync(reportPath)) {
    console.warn(
      `[qa:remote-migration] No matrix report found at ${reportPath}.`
    );
    return;
  }

  try {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const checks = Array.isArray(report.checks) ? report.checks : [];
    const passed = checks.filter((entry) => entry.status === 'pass').length;
    const failed = checks.filter((entry) => entry.status === 'fail').length;

    console.log('\n[qa:remote-migration] Matrix summary');
    console.log(`Target: ${report.baseURL || 'unknown'}`);
    console.log(
      `Checks: ${passed} passed, ${failed} failed, ${checks.length} total`
    );

    if (failed > 0) {
      console.log('Failed checks:');
      checks
        .filter((entry) => entry.status === 'fail')
        .forEach((entry) => {
          console.log(`- ${entry.id}: ${entry.label}`);
          if (entry.error) {
            console.log(`  ${entry.error}`);
          }
        });
    }

    const manualResidue = Array.isArray(report.manualResidue)
      ? report.manualResidue
      : [];
    if (manualResidue.length > 0) {
      console.log('Manual-only residue:');
      manualResidue.forEach((item) => {
        console.log(`- ${item}`);
      });
    }

    console.log(`[qa:remote-migration] Detailed JSON: ${reportPath}`);
  } catch (error) {
    console.warn(
      `[qa:remote-migration] Unable to parse report at ${reportPath}: ${error.message}`
    );
  }
}

const options = parseArgs(process.argv.slice(2));

if (!/^https?:\/\//i.test(options.baseURL)) {
  console.error(
    `Invalid --baseURL value: "${options.baseURL}". Include http:// or https://.`
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

let realV2Save = null;
try {
  realV2Save = loadRealV2SavePayload(options.realV2SavePath);
} catch (error) {
  console.error(`[qa:remote-migration] ${error.message}`);
  process.exit(1);
}

const reportPath = resolve(options.reportPath);
fs.mkdirSync(dirname(reportPath), { recursive: true });

const env = {
  ...process.env,
  BASE_URL: options.baseURL,
  PLAYWRIGHT_SKIP_INSTALL_DEPS: '1',
  REMOTE_MIGRATION: '1',
  REMOTE_MIGRATION_USE_WEBSERVER: isLocalHost ? '1' : '0',
  REMOTE_MIGRATION_REPORT_FILE: reportPath,
};

if (realV2Save) {
  env.REMOTE_MIGRATION_REAL_V2_SAVE = JSON.stringify(realV2Save.payload);
  env.REMOTE_MIGRATION_REAL_V2_LABEL = realV2Save.path;
}

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
  `[qa:remote-migration] fixture-mode=${realV2Save ? `built-in + real save (${realV2Save.path})` : 'built-in only'}`
);
console.log(
  `[qa:remote-migration] webServer=${env.REMOTE_MIGRATION_USE_WEBSERVER === '1' ? 'managed by Playwright (local)' : 'disabled (remote target)'}`
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
  printConciseReport(reportPath);

  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
