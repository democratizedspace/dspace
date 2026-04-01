#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..');
const frontendDir = join(repoRoot, 'frontend');
const nodeExecutable = process.execPath;

const DEFAULT_BASE_URL = 'http://127.0.0.1:4173';
const PRIMARY_REAL_SAVE_ENV = 'REMOTE_MIGRATION_REAL_V2_JSON';
const LEGACY_REAL_SAVE_ENV = 'QA_REMOTE_MIGRATION_REAL_V2_JSON';
const DEFAULT_REAL_V2_FIXTURE = join(
  repoRoot,
  'frontend',
  'src',
  'utils',
  'legacySaveFixtures',
  'legacy_v2_real_save.json'
);

function parseArgs(argv) {
  const parsed = {
    baseURL: DEFAULT_BASE_URL,
    project: 'chromium',
    realV2JsonPath: '',
    realV2EnvVar: PRIMARY_REAL_SAVE_ENV,
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

    if (arg === '--real-v2-save' || arg === '--real-v2-json') {
      parsed.realV2JsonPath = argv[index + 1] || '';
      index += 1;
      continue;
    }

    if (arg.startsWith('--real-v2-save=') || arg.startsWith('--real-v2-json=')) {
      parsed.realV2JsonPath = arg.slice(arg.indexOf('=') + 1) || '';
      continue;
    }

    if (arg === '--real-v2-env') {
      parsed.realV2EnvVar = argv[index + 1] || parsed.realV2EnvVar;
      index += 1;
      continue;
    }

    if (arg.startsWith('--real-v2-env=')) {
      parsed.realV2EnvVar = arg.slice(arg.indexOf('=') + 1) || parsed.realV2EnvVar;
      continue;
    }

    parsed.passthrough.push(arg);
  }

  return parsed;
}

function readRealV2Json(options) {
  if (options.realV2JsonPath) {
    const absolutePath = resolve(process.cwd(), options.realV2JsonPath);
    if (!existsSync(absolutePath)) {
      throw new Error(`--real-v2-save file does not exist: ${absolutePath}`);
    }

    const raw = readFileSync(absolutePath, 'utf8').trim();
    if (!raw) {
      throw new Error(`--real-v2-save file is empty: ${absolutePath}`);
    }

    try {
      JSON.parse(raw);
    } catch {
      throw new Error(`--real-v2-save file is not valid JSON: ${absolutePath}`);
    }
    return {
      payload: raw,
      source: `file:${absolutePath}`,
    };
  }

  const envValue =
    process.env[options.realV2EnvVar] ||
    (options.realV2EnvVar === PRIMARY_REAL_SAVE_ENV ? process.env[LEGACY_REAL_SAVE_ENV] : '');
  const sourceEnvVar = process.env[options.realV2EnvVar]
    ? options.realV2EnvVar
    : options.realV2EnvVar === PRIMARY_REAL_SAVE_ENV
      ? LEGACY_REAL_SAVE_ENV
      : options.realV2EnvVar;
  if (!envValue) {
    if (!existsSync(DEFAULT_REAL_V2_FIXTURE)) {
      throw new Error(`Default real v2 fixture does not exist: ${DEFAULT_REAL_V2_FIXTURE}`);
    }

    const fixtureRaw = readFileSync(DEFAULT_REAL_V2_FIXTURE, 'utf8').trim();
    if (!fixtureRaw) {
      throw new Error(`Default real v2 fixture is empty: ${DEFAULT_REAL_V2_FIXTURE}`);
    }

    try {
      JSON.parse(fixtureRaw);
    } catch {
      throw new Error(`Default real v2 fixture is not valid JSON: ${DEFAULT_REAL_V2_FIXTURE}`);
    }

    return {
      payload: fixtureRaw,
      source: `fixture:${DEFAULT_REAL_V2_FIXTURE}`,
    };
  }

  try {
    JSON.parse(envValue);
  } catch {
    throw new Error(`Environment variable ${options.realV2EnvVar} is not valid JSON`);
  }
  return {
    payload: envValue,
    source: `env:${sourceEnvVar}`,
  };
}

function writeRealV2PayloadFile(payload) {
  if (!payload) {
    return '';
  }

  const outputDir = join(frontendDir, 'test-results');
  const outputPath = join(outputDir, 'remote-migration-real-v2.json');
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, `${payload.trim()}\n`, 'utf8');
  return outputPath;
}

function resolvePlaywrightCliPath() {
  const candidates = [
    join(frontendDir, 'node_modules', '@playwright', 'test', 'cli.js'),
    join(repoRoot, 'node_modules', '@playwright', 'test', 'cli.js'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    'Playwright CLI was not found. Run `pnpm install` in the repo root (or `npm install` with workspaces enabled).'
  );
}

function printChecklistSummary(reportPath) {
  const absolutePath = join(frontendDir, reportPath);
  if (!existsSync(absolutePath)) {
    console.warn(`[qa:remote-migration] No harness report found at ${absolutePath}`);
    return;
  }

  try {
    const raw = readFileSync(absolutePath, 'utf8');
    const report = JSON.parse(raw);
    const rows = Array.isArray(report.results) ? report.results : [];
    const passed = rows.filter((row) => row.status === 'pass').length;
    const failed = rows.filter((row) => row.status === 'fail').length;
    const skipped = rows.filter((row) => row.status === 'skip').length;

    console.log('\n[qa:remote-migration] Checklist summary');
    console.log(`  pass=${passed} fail=${failed} skip=${skipped}`);

    for (const row of rows) {
      const marker = row.status === 'pass' ? '✅' : row.status === 'fail' ? '❌' : '⚪';
      const detail = row.detail ? ` — ${row.detail}` : '';
      console.log(`  ${marker} ${row.id}: ${row.label}${detail}`);
    }
  } catch (error) {
    console.warn(
      `[qa:remote-migration] Failed to parse harness report: ${error instanceof Error ? error.message : String(error)}`
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

let realV2;
try {
  realV2 = readRealV2Json(options);
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`[qa:remote-migration] ${detail}`);
  process.exit(1);
}
const realV2PayloadPath = writeRealV2PayloadFile(realV2.payload);
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
  REMOTE_MIGRATION: '1',
  REMOTE_MIGRATION_USE_WEBSERVER: isLocalHost ? '1' : '0',
  REMOTE_MIGRATION_REAL_V2_JSON_PATH: realV2PayloadPath,
};

let playwrightCliPath;
try {
  playwrightCliPath = resolvePlaywrightCliPath();
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`[qa:remote-migration] ${detail}`);
  process.exit(1);
}

const playwrightArgs = [
  playwrightCliPath,
  'test',
  'e2e/remote-legacy-migration.spec.ts',
  `--project=${options.project}`,
  ...options.passthrough,
];

console.log(`[qa:remote-migration] baseURL=${options.baseURL}`);
console.log(`[qa:remote-migration] project=${options.project}`);
console.log(`[qa:remote-migration] realV2Source=${realV2.source}`);
console.log(
  `[qa:remote-migration] realV2PayloadPath=${realV2PayloadPath || 'none'}`
);
console.log(
  `[qa:remote-migration] webServer=${env.REMOTE_MIGRATION_USE_WEBSERVER === '1' ? 'managed by Playwright (local)' : 'disabled (remote target)'}`
);

const child = spawn(nodeExecutable, playwrightArgs, {
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

  printChecklistSummary('test-results/remote-migration-harness-report.json');
  process.exit(code ?? 1);
});
