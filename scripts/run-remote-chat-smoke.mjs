#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const frontendDir = join(repoRoot, 'frontend');

const fields = {
  'base-url': ['baseURL', 'DSPACE_SMOKE_BASE_URL'],
  'expected-version': ['version', 'DSPACE_EXPECTED_VERSION'],
  'expected-revision': ['revision', 'DSPACE_EXPECTED_REVISION'],
  'expected-provider': ['provider', 'DSPACE_EXPECTED_PROVIDER'],
  'expected-token-place-origin': [
    'tokenPlaceOrigin',
    'DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN',
  ],
  'expected-token-place-model': [
    'tokenPlaceModel',
    'DSPACE_EXPECTED_TOKEN_PLACE_MODEL',
  ],
};

export function parseArgs(argv, env = process.env) {
  const options = Object.fromEntries(
    Object.values(fields).map(([key, envName]) => [
      key,
      env[envName]?.trim() || undefined,
    ])
  );
  const seen = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const match = /^--([^=]+)(?:=(.*))?$/.exec(argument);
    if (!match || !fields[match[1]])
      throw new Error(`unknown argument: ${argument}`);
    const value = match[2] ?? argv[++index];
    if (!value || value.startsWith('--'))
      throw new Error(`missing value for --${match[1]}`);
    if (seen.has(match[1]) && seen.get(match[1]) !== value) {
      throw new Error(`contradictory values for --${match[1]}`);
    }
    seen.set(match[1], value);
    options[fields[match[1]][0]] = value.trim(); // flags intentionally override environment
  }
  return options;
}

export function validateOptions(options) {
  for (const [key, label] of [
    ['baseURL', 'base URL'],
    ['version', 'expected version'],
    ['revision', 'expected revision'],
    ['provider', 'expected provider'],
  ]) {
    if (!options[key]) throw new Error(`missing ${label}`);
  }
  let url;
  try {
    url = new URL(options.baseURL);
  } catch {
    throw new Error('base URL must be an absolute HTTP(S) URL');
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new Error('base URL must be a credential-free HTTP(S) URL');
  }
  if (
    !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(
      options.version
    )
  ) {
    throw new Error('expected version must be an exact semantic version');
  }
  if (!/^[0-9a-f]{40}$/.test(options.revision)) {
    throw new Error(
      'expected revision must be a lowercase full 40-character Git SHA'
    );
  }
  if (!['token-place', 'openai'].includes(options.provider)) {
    throw new Error('expected provider must be token-place or openai');
  }
  if (options.provider === 'token-place') {
    if (!options.tokenPlaceOrigin || !options.tokenPlaceModel) {
      throw new Error(
        'token.place origin and model are required for token-place'
      );
    }
    const origin = new URL(options.tokenPlaceOrigin);
    if (
      origin.origin !== options.tokenPlaceOrigin ||
      origin.protocol !== 'https:'
    ) {
      throw new Error(
        'token.place origin must be an HTTPS origin without a path'
      );
    }
  } else if (options.tokenPlaceOrigin || options.tokenPlaceModel) {
    throw new Error(
      'token.place expectations are inapplicable when provider is openai'
    );
  }
  return options;
}

export function buildEnv(options, env = process.env) {
  const hostname = new URL(options.baseURL).hostname;
  const local = ['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(hostname);
  return {
    ...env,
    BASE_URL: options.baseURL,
    REMOTE_SMOKE: '1',
    REMOTE_SMOKE_USE_WEBSERVER: local ? '1' : '0',
    PLAYWRIGHT_SKIP_INSTALL_DEPS: '1',
    DSPACE_EXPECTED_VERSION: options.version,
    DSPACE_EXPECTED_REVISION: options.revision,
    DSPACE_EXPECTED_PROVIDER: options.provider,
    DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN: options.tokenPlaceOrigin || '',
    DSPACE_EXPECTED_TOKEN_PLACE_MODEL: options.tokenPlaceModel || '',
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
  console.log(
    `[qa:remote-chat-smoke] approved=${options.version} revision=${options.revision}`
  );
  console.log(
    `[qa:remote-chat-smoke] provider=${options.provider}; transport=mocked; profile=isolated`
  );
  const child = spawn(
    'node',
    [
      './node_modules/@playwright/test/cli.js',
      'test',
      'e2e/remote-chat-smoke.spec.ts',
      '--project=chromium',
    ],
    { cwd: frontendDir, env: buildEnv(options), stdio: 'inherit' }
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
