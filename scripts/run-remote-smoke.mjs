#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..');
const frontendDir = join(repoRoot, 'frontend');

const DEFAULT_BASE_URL = 'http://127.0.0.1:4173';

function parseArgs(argv) {
  const parsed = {
    baseURL: DEFAULT_BASE_URL,
    chatMode: 'ui',
    chatLiveTransport: 'mock',
    chatAuth: process.env.REMOTE_SMOKE_CHAT_AUTH || '',
    mutate: false,
    project: 'chromium',
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

    if (arg === '--chat-mode') {
      parsed.chatMode = argv[index + 1] || parsed.chatMode;
      index += 1;
      continue;
    }

    if (arg.startsWith('--chat-mode=')) {
      parsed.chatMode = arg.slice(arg.indexOf('=') + 1) || parsed.chatMode;
      continue;
    }

    if (arg === '--mutate') {
      parsed.mutate = true;
      continue;
    }

    if (arg === '--chat-live-transport') {
      parsed.chatLiveTransport = argv[index + 1] || parsed.chatLiveTransport;
      index += 1;
      continue;
    }

    if (arg.startsWith('--chat-live-transport=')) {
      parsed.chatLiveTransport = arg.slice(arg.indexOf('=') + 1) || parsed.chatLiveTransport;
      continue;
    }

    if (arg === '--chat-auth') {
      parsed.chatAuth = argv[index + 1] || parsed.chatAuth;
      index += 1;
      continue;
    }

    if (arg.startsWith('--chat-auth=')) {
      parsed.chatAuth = arg.slice(arg.indexOf('=') + 1) || parsed.chatAuth;
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

const options = parseArgs(process.argv.slice(2));

if (!/^https?:\/\//i.test(options.baseURL)) {
  console.error(
    `Invalid --baseURL value: "${options.baseURL}". Include http:// or https://.`
  );
  process.exit(1);
}

if (!['ui', 'live'].includes(options.chatMode)) {
  console.error(
    `Invalid --chat-mode value: "${options.chatMode}". Use "ui" or "live".`
  );
  process.exit(1);
}

if (!['mock', 'real'].includes(options.chatLiveTransport)) {
  console.error(
    `Invalid --chat-live-transport value: "${options.chatLiveTransport}". Use "mock" or "real".`
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

const env = {
  ...process.env,
  BASE_URL: options.baseURL,
  PLAYWRIGHT_SKIP_INSTALL_DEPS: '1',
  REMOTE_SMOKE: '1',
  REMOTE_SMOKE_CHAT_MODE: options.chatMode,
  REMOTE_SMOKE_CHAT_LIVE_TRANSPORT: options.chatLiveTransport,
  REMOTE_SMOKE_CHAT_AUTH: options.chatAuth,
  REMOTE_SMOKE_MUTATION: options.mutate ? '1' : '0',
  REMOTE_SMOKE_USE_WEBSERVER: isLocalHost ? '1' : '0',
};

const playwrightArgs = [
  './node_modules/@playwright/test/cli.js',
  'test',
  'e2e/remote-release-smoke.spec.ts',
  `--project=${options.project}`,
  ...options.passthrough,
];

console.log(`[qa:remote-smoke] baseURL=${options.baseURL}`);
console.log(`[qa:remote-smoke] chatMode=${options.chatMode}`);
if (options.chatMode === 'live') {
  console.log(`[qa:remote-smoke] chatLiveTransport=${options.chatLiveTransport}`);
  if (options.chatLiveTransport === 'real') {
    console.log(
      `[qa:remote-smoke] chatAuth=${options.chatAuth ? 'provided via env/CLI' : 'not provided (request may fail)'}`
    );
  }
}
console.log(
  `[qa:remote-smoke] mutation=${options.mutate ? 'enabled' : 'disabled'}`
);
console.log(`[qa:remote-smoke] project=${options.project}`);
console.log(
  `[qa:remote-smoke] webServer=${env.REMOTE_SMOKE_USE_WEBSERVER === '1' ? 'managed by Playwright (local)' : 'disabled (remote target)'}`
);

const child = spawn('node', playwrightArgs, {
  cwd: frontendDir,
  stdio: 'inherit',
  env,
});

child.on('error', (err) => {
  console.error(`[qa:remote-smoke] Failed to start Playwright process: ${err.message}`);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
