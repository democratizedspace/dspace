#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendDir = join(scriptDir, '..', 'frontend');

const definitions = {
  baseURL: ['base-url', 'DSPACE_SMOKE_BASE_URL'],
  expectedVersion: ['expected-version', 'DSPACE_EXPECTED_VERSION'],
  expectedRevision: ['expected-revision', 'DSPACE_EXPECTED_REVISION'],
  expectedProvider: ['expected-provider', 'DSPACE_EXPECTED_PROVIDER'],
  expectedTokenPlaceOrigin: [
    'expected-token-place-origin',
    'DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN',
  ],
  expectedTokenPlaceModel: [
    'expected-token-place-model',
    'DSPACE_EXPECTED_TOKEN_PLACE_MODEL',
  ],
};

export function parseAndValidateArgs(argv, env = process.env) {
  const flags = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith('--'))
      throw new Error(`validation: unexpected argument "${argument}"`);
    const equals = argument.indexOf('=');
    const name = argument.slice(2, equals === -1 ? undefined : equals);
    const definition = Object.values(definitions).find(
      ([flag]) => flag === name
    );
    if (!definition) throw new Error(`validation: unknown flag "--${name}"`);
    const value = equals === -1 ? argv[++index] : argument.slice(equals + 1);
    if (!value || value.startsWith('--'))
      throw new Error(`validation: --${name} requires a value`);
    if (flags.has(name) && flags.get(name) !== value) {
      throw new Error(`validation: contradictory values for --${name}`);
    }
    flags.set(name, value.trim());
  }

  const result = {};
  for (const [key, [flag, environment]] of Object.entries(definitions)) {
    // Explicit flags deterministically take precedence over the environment.
    result[key] = flags.get(flag) ?? env[environment]?.trim();
  }
  const missing = Object.entries(definitions)
    .filter(([key]) => !result[key] && !key.startsWith('expectedTokenPlace'))
    .map(([, [, environment]]) => environment);
  if (missing.length)
    throw new Error(
      `validation: missing required input(s): ${missing.join(', ')}`
    );

  let base;
  try {
    base = new URL(result.baseURL);
  } catch {
    throw new Error('validation: base URL must be an absolute http(s) URL');
  }
  if (
    !['http:', 'https:'].includes(base.protocol) ||
    base.username ||
    base.password
  ) {
    throw new Error(
      'validation: base URL must be an absolute credential-free http(s) URL'
    );
  }
  result.baseURL = base.href.replace(/\/$/, '');
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(result.expectedVersion)) {
    throw new Error(
      'validation: expected version must be an exact semantic version'
    );
  }
  if (!/^[0-9a-f]{40}$/.test(result.expectedRevision)) {
    throw new Error(
      'validation: expected revision must be a lowercase full 40-character Git SHA'
    );
  }
  if (!['token-place', 'openai'].includes(result.expectedProvider)) {
    throw new Error(
      'validation: expected provider must be token-place or openai'
    );
  }

  if (result.expectedProvider === 'token-place') {
    if (!result.expectedTokenPlaceOrigin || !result.expectedTokenPlaceModel) {
      throw new Error(
        'validation: token-place requires DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN and DSPACE_EXPECTED_TOKEN_PLACE_MODEL'
      );
    }
    let origin;
    try {
      origin = new URL(result.expectedTokenPlaceOrigin);
    } catch {
      throw new Error(
        'validation: token.place origin must be an absolute http(s) origin'
      );
    }
    if (
      !['http:', 'https:'].includes(origin.protocol) ||
      origin.origin !== result.expectedTokenPlaceOrigin.replace(/\/$/, '') ||
      origin.username ||
      origin.password
    ) {
      throw new Error(
        'validation: token.place origin must contain only scheme, host, and port'
      );
    }
    result.expectedTokenPlaceOrigin = origin.origin;
    if (
      !/^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$/.test(
        result.expectedTokenPlaceModel
      )
    ) {
      throw new Error('validation: token.place model is malformed');
    }
  } else if (
    result.expectedTokenPlaceOrigin ||
    result.expectedTokenPlaceModel
  ) {
    throw new Error(
      'validation: token.place origin/model are inapplicable when provider is openai'
    );
  }
  return result;
}

export function buildSmokeEnv(options, baseEnv = process.env) {
  // Node exposes bracketed IPv6 URL hostnames as "[::1]"; normalize them before
  // deciding whether Playwright should manage the local preview server.
  const hostname = new URL(options.baseURL).hostname.replace(/^\[|\]$/g, '');
  const local = ['127.0.0.1', 'localhost', '0.0.0.0', '::1'].includes(hostname);
  return {
    ...baseEnv,
    BASE_URL: options.baseURL,
    REMOTE_CHAT_SMOKE: '1',
    REMOTE_CHAT_SMOKE_USE_WEBSERVER: local ? '1' : '0',
    PLAYWRIGHT_SKIP_INSTALL_DEPS: '1',
    DSPACE_EXPECTED_VERSION: options.expectedVersion,
    DSPACE_EXPECTED_REVISION: options.expectedRevision,
    DSPACE_EXPECTED_PROVIDER: options.expectedProvider,
    DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN: options.expectedTokenPlaceOrigin || '',
    DSPACE_EXPECTED_TOKEN_PLACE_MODEL: options.expectedTokenPlaceModel || '',
  };
}

export function main(argv = process.argv.slice(2)) {
  let options;
  try {
    options = parseAndValidateArgs(argv);
  } catch (error) {
    console.error(`[qa:remote-chat-smoke] ${error.message}`);
    process.exitCode = 2;
    return;
  }
  console.log(`[qa:remote-chat-smoke] target=${options.baseURL}`);
  console.log(
    `[qa:remote-chat-smoke] expectedVersion=${options.expectedVersion}`
  );
  console.log(
    `[qa:remote-chat-smoke] expectedRevision=${options.expectedRevision}`
  );
  console.log(
    `[qa:remote-chat-smoke] expectedProvider=${options.expectedProvider}`
  );
  console.log(
    '[qa:remote-chat-smoke] transport=intercepted; profile=isolated; mutation=disabled'
  );
  const child = spawn(
    'node',
    [
      './node_modules/@playwright/test/cli.js',
      'test',
      'e2e/remote-chat-smoke.spec.ts',
      '--project=chromium',
    ],
    { cwd: frontendDir, env: buildSmokeEnv(options), stdio: 'inherit' }
  );
  child.on('error', (error) => {
    console.error(`[qa:remote-chat-smoke] launch: ${error.message}`);
    process.exitCode = 1;
  });
  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exitCode = code ?? 1;
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
