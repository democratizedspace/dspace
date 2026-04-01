#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..');
const frontendDir = join(repoRoot, 'frontend');

const DEFAULT_BASE_URL = 'http://127.0.0.1:4173';

export function parseArgs(argv) {
  const parsed = {
    baseURL: DEFAULT_BASE_URL,
    chatMode: 'ui',
    chatLiveBackend: process.env.REMOTE_SMOKE_CHAT_LIVE_BACKEND || 'mock',
    mutate: true,
    mutationMode: 'default-on',
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
      parsed.mutationMode = 'forced-on';
      continue;
    }

    if (arg === '--no-mutate' || arg === '--safe') {
      parsed.mutate = false;
      parsed.mutationMode = arg === '--safe' ? 'safe-mode' : 'forced-off';
      continue;
    }

    if (arg === '--chat-live-backend') {
      parsed.chatLiveBackend = argv[index + 1] || parsed.chatLiveBackend;
      index += 1;
      continue;
    }

    if (arg.startsWith('--chat-live-backend=')) {
      parsed.chatLiveBackend = arg.slice(arg.indexOf('=') + 1) || parsed.chatLiveBackend;
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

export function runRemoteSmoke(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);

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

  if (!['mock', 'real'].includes(options.chatLiveBackend)) {
    console.error(
      `Invalid --chat-live-backend value: "${options.chatLiveBackend}". Use "mock" or "real".`
    );
    process.exit(1);
  }

  if (options.chatLiveBackend !== 'mock' && options.chatMode !== 'live') {
    console.warn(
      `[qa:remote-smoke] Warning: --chat-live-backend=${options.chatLiveBackend} has no effect unless --chat-mode=live is also set.`
    );
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
    REMOTE_SMOKE_CHAT_LIVE_BACKEND: options.chatLiveBackend,
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
    console.log(`[qa:remote-smoke] chatLiveBackend=${options.chatLiveBackend}`);
    if (options.chatLiveBackend === 'real') {
      const hasLiveKey = Boolean(process.env.REMOTE_SMOKE_CHAT_API_KEY);
      console.log(
        '[qa:remote-smoke] chatLiveRealKey=' +
          `${hasLiveKey ? 'provided via env' : 'missing'}`
      );
      if (!hasLiveKey) {
        console.error(
          '[qa:remote-smoke] REMOTE_SMOKE_CHAT_API_KEY is required when --chat-live-backend=real and --chat-mode=live.'
        );
        process.exit(1);
      }
    }
  }
  console.log(
    `[qa:remote-smoke] mutation=${options.mutate ? 'enabled' : 'disabled'} (${options.mutationMode})`
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
}

if (process.argv[1] === __filename) {
  runRemoteSmoke();
}
