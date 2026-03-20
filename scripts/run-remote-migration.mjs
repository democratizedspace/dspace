#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..');
const frontendDir = join(repoRoot, 'frontend');

const DEFAULT_BASE_URL = 'http://127.0.0.1:4173';

function parseArgs(argv) {
  const parsed = {
    baseURL: DEFAULT_BASE_URL,
    project: 'chromium',
    realV2SavePath: process.env.REMOTE_MIGRATION_REAL_V2_SAVE_PATH || '',
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

    if (arg === '--real-v2-save') {
      parsed.realV2SavePath = argv[index + 1] || parsed.realV2SavePath;
      index += 1;
      continue;
    }

    if (arg.startsWith('--real-v2-save=')) {
      parsed.realV2SavePath = arg.slice(arg.indexOf('=') + 1) || parsed.realV2SavePath;
      continue;
    }

    parsed.passthrough.push(arg);
  }

  return parsed;
}

function loadRealV2Payload(options) {
  const fromEnvJson = process.env.REMOTE_MIGRATION_REAL_V2_JSON;
  if (fromEnvJson && fromEnvJson.trim()) {
    return {
      source: 'env:REMOTE_MIGRATION_REAL_V2_JSON',
      json: fromEnvJson,
    };
  }

  if (!options.realV2SavePath) {
    return null;
  }

  const absolutePath = resolve(process.cwd(), options.realV2SavePath);
  const raw = readFileSync(absolutePath, 'utf8');
  return {
    source: absolutePath,
    json: raw,
  };
}

const options = parseArgs(process.argv.slice(2));

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

let realV2Payload = null;
try {
  realV2Payload = loadRealV2Payload(options);
} catch (error) {
  console.error(`[qa:remote-migration] Failed to read real v2 save payload: ${error.message}`);
  process.exit(1);
}

if (realV2Payload?.json) {
  try {
    JSON.parse(realV2Payload.json);
  } catch (error) {
    console.error(
      `[qa:remote-migration] Real v2 save payload is not valid JSON (${realV2Payload.source}): ${error.message}`
    );
    process.exit(1);
  }
}

const env = {
  ...process.env,
  BASE_URL: options.baseURL,
  PLAYWRIGHT_SKIP_INSTALL_DEPS: '1',
  REMOTE_SMOKE: '1',
  REMOTE_MIGRATION: '1',
  REMOTE_SMOKE_USE_WEBSERVER: isLocalHost ? '1' : '0',
  REMOTE_MIGRATION_REAL_V2_JSON_B64: realV2Payload?.json
    ? Buffer.from(realV2Payload.json).toString('base64')
    : '',
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
  `[qa:remote-migration] webServer=${env.REMOTE_SMOKE_USE_WEBSERVER === '1' ? 'managed by Playwright (local)' : 'disabled (remote target)'}`
);
console.log(
  `[qa:remote-migration] realV2Save=${realV2Payload?.source ?? 'not provided (running canned fixtures only)'}`
);

const child = spawn('node', playwrightArgs, {
  cwd: frontendDir,
  stdio: 'inherit',
  env,
});

child.on('error', (err) => {
  console.error(`[qa:remote-migration] Failed to start Playwright process: ${err.message}`);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
