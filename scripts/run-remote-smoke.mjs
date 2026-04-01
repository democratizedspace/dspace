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

    if (arg === '--no-mutate' || arg === '--safe') {
      parsed.mutate = false;
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

export function isLocalHostTarget(baseURL) {
  const url = new URL(baseURL);
  return (
    url.hostname === '127.0.0.1' ||
    url.hostname === 'localhost' ||
    url.hostname === '0.0.0.0' ||
    url.hostname === '::1' ||
    url.hostname.endsWith('.local')
  );
}

export function buildRemoteSmokeEnv(options, envSource = process.env) {
  return {
    ...envSource,
    BASE_URL: options.baseURL,
    PLAYWRIGHT_SKIP_INSTALL_DEPS: '1',
    REMOTE_SMOKE: '1',
    REMOTE_SMOKE_CHAT_MODE: options.chatMode,
    REMOTE_SMOKE_CHAT_LIVE_BACKEND: options.chatLiveBackend,
    REMOTE_SMOKE_MUTATION: options.mutate ? '1' : '0',
    REMOTE_SMOKE_USE_WEBSERVER: isLocalHostTarget(options.baseURL) ? '1' : '0',
  };
}

export function runRemoteSmoke(argv = process.argv.slice(2), envSource = process.env) {
  const options = parseArgs(argv);

  if (!/^https?:\/\//i.test(options.baseURL)) {
    console.error(
      `Invalid --baseURL value: "${options.baseURL}". Include http:// or https://.`
    );
    return 1;
  }

  if (!['ui', 'live'].includes(options.chatMode)) {
    console.error(
      `Invalid --chat-mode value: "${options.chatMode}". Use "ui" or "live".`
    );
    return 1;
  }

  if (!['mock', 'real'].includes(options.chatLiveBackend)) {
    console.error(
      `Invalid --chat-live-backend value: "${options.chatLiveBackend}". Use "mock" or "real".`
    );
    return 1;
  }

  if (options.chatLiveBackend !== 'mock' && options.chatMode !== 'live') {
    console.warn(
      `[qa:remote-smoke] Warning: --chat-live-backend=${options.chatLiveBackend} has no effect unless --chat-mode=live is also set.`
    );
  }

  const env = buildRemoteSmokeEnv(options, envSource);

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
      const hasLiveKey = Boolean(envSource.REMOTE_SMOKE_CHAT_API_KEY);
      console.log(
        '[qa:remote-smoke] chatLiveRealKey=' +
          `${hasLiveKey ? 'provided via env' : 'missing'}`
      );
      if (!hasLiveKey) {
        console.error(
          '[qa:remote-smoke] REMOTE_SMOKE_CHAT_API_KEY is required when --chat-live-backend=real and --chat-mode=live.'
        );
        return 1;
      }
    }
  }
  console.log(
    `[qa:remote-smoke] customItemCreateDelete=${options.mutate ? 'enabled (default)' : 'disabled (--no-mutate/--safe)'}`
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

  return 0;
}

const isEntrypoint = process.argv[1] === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  const exitCode = runRemoteSmoke();
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}
