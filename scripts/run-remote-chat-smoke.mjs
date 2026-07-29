#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const frontendDir = join(repoRoot, 'frontend');
const ENV_KEYS = {
  baseURL: 'DSPACE_SMOKE_BASE_URL',
  version: 'DSPACE_EXPECTED_VERSION',
  revision: 'DSPACE_EXPECTED_REVISION',
  provider: 'DSPACE_EXPECTED_PROVIDER',
  tokenPlaceOrigin: 'DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN',
  tokenPlaceModel: 'DSPACE_EXPECTED_TOKEN_PLACE_MODEL',
};
const FLAGS = {
  '--base-url': 'baseURL',
  '--baseURL': 'baseURL',
  '--expected-version': 'version',
  '--expected-revision': 'revision',
  '--expected-provider': 'provider',
  '--expected-token-place-origin': 'tokenPlaceOrigin',
  '--expected-token-place-model': 'tokenPlaceModel',
};

export function parseArgs(argv, env = process.env) {
  const values = Object.fromEntries(
    Object.entries(ENV_KEYS).map(([name, key]) => [
      name,
      env[key]?.trim() || undefined,
    ])
  );
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const [flag, inline] = arg.split(/=(.*)/s, 2);
    const name = FLAGS[flag];
    if (!name) {
      throw new Error(`unknown argument: ${arg}`);
    }
    const value = inline ?? argv[++index];
    if (!value?.trim()) throw new Error(`${flag} requires a value`);
    values[name] = value.trim(); // Flags deterministically override the environment.
  }
  return values;
}

export function validateOptions(options) {
  const missing = Object.entries(ENV_KEYS)
    .filter(
      ([name]) =>
        !options[name] &&
        !['tokenPlaceOrigin', 'tokenPlaceModel'].includes(name)
    )
    .map(([, key]) => key);
  if (missing.length)
    throw new Error(`missing required expectation(s): ${missing.join(', ')}`);
  let base;
  try {
    base = new URL(options.baseURL);
  } catch {
    throw new Error('base URL must be an absolute http(s) URL');
  }
  if (
    !['http:', 'https:'].includes(base.protocol) ||
    base.username ||
    base.password
  )
    throw new Error('base URL must be an absolute credential-free http(s) URL');
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(options.version))
    throw new Error(
      'expected version must be an exact semantic application version'
    );
  if (!/^[0-9a-f]{40}$/.test(options.revision))
    throw new Error(
      'expected revision must be a lowercase full 40-character Git SHA'
    );
  if (!['token-place', 'openai'].includes(options.provider))
    throw new Error('expected provider must be token-place or openai');
  if (options.provider === 'token-place') {
    if (!options.tokenPlaceOrigin || !options.tokenPlaceModel)
      throw new Error(
        'token-place origin and model are required for token-place'
      );
    let origin;
    try {
      const parsed = new URL(options.tokenPlaceOrigin);
      if (
        parsed.protocol !== 'https:' ||
        parsed.origin !== parsed.href.replace(/\/$/, '')
      )
        throw 0;
      origin = parsed.origin;
    } catch {
      throw new Error(
        'token-place origin must be an HTTPS origin without a path'
      );
    }
    options.tokenPlaceOrigin = origin;
  } else if (options.tokenPlaceOrigin || options.tokenPlaceModel) {
    throw new Error(
      'token-place origin/model are inapplicable when provider is openai'
    );
  }
  return options;
}

export function buildEnv(options, baseEnv = process.env) {
  const hostname = new URL(options.baseURL).hostname;
  const local = ['127.0.0.1', 'localhost', '0.0.0.0', '::1'].includes(hostname);
  return {
    ...baseEnv,
    BASE_URL: options.baseURL,
    REMOTE_SMOKE: '1',
    REMOTE_SMOKE_USE_WEBSERVER: local ? '1' : '0',
    PLAYWRIGHT_SKIP_INSTALL_DEPS: '1',
    ...Object.fromEntries(
      Object.entries(ENV_KEYS).map(([name, key]) => [key, options[name] || ''])
    ),
  };
}

export function main(argv = process.argv.slice(2)) {
  let options;
  try {
    options = validateOptions(parseArgs(argv));
  } catch (error) {
    console.error(`[qa:remote-chat-smoke] validation: ${error.message}`);
    process.exitCode = 2;
    return;
  }
  console.log(
    `[qa:remote-chat-smoke] target=${new URL(options.baseURL).origin}`
  );
  console.log(`[qa:remote-chat-smoke] expectedVersion=${options.version}`);
  console.log(`[qa:remote-chat-smoke] expectedRevision=${options.revision}`);
  console.log(`[qa:remote-chat-smoke] expectedProvider=${options.provider}`);
  console.log(
    '[qa:remote-chat-smoke] transport=isolated mocked providers (non-mutating)'
  );
  const child = spawn(
    'node',
    [
      './node_modules/@playwright/test/cli.js',
      'test',
      'e2e/remote-chat-smoke.spec.ts',
      '--project=chromium',
    ],
    { cwd: frontendDir, stdio: 'inherit', env: buildEnv(options) }
  );
  child.on('error', (error) => {
    console.error(`[qa:remote-chat-smoke] launch: ${error.message}`);
    process.exitCode = 1;
  });
  child.on('exit', (code) => (process.exitCode = code ?? 1));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
