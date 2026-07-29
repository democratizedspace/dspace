#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'frontend'
);
const fields = {
  baseURL: ['base-url', 'DSPACE_SMOKE_BASE_URL'],
  version: ['expected-version', 'DSPACE_EXPECTED_VERSION'],
  revision: ['expected-revision', 'DSPACE_EXPECTED_REVISION'],
  provider: ['expected-provider', 'DSPACE_EXPECTED_PROVIDER'],
  tokenPlaceOrigin: [
    'expected-token-place-origin',
    'DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN',
  ],
  tokenPlaceModel: [
    'expected-token-place-model',
    'DSPACE_EXPECTED_TOKEN_PLACE_MODEL',
  ],
};

export function parseArgs(argv, env = process.env) {
  const result = Object.fromEntries(
    Object.entries(fields).map(([key, [, envName]]) => [
      key,
      env[envName]?.trim() || undefined,
    ])
  );
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const match = Object.entries(fields).find(
      ([, [flag]]) =>
        argument === `--${flag}` || argument.startsWith(`--${flag}=`)
    );
    if (!match) throw new Error(`unknown argument: ${argument}`);
    const [key, [flag]] = match;
    const value = argument.includes('=')
      ? argument.slice(argument.indexOf('=') + 1)
      : argv[++index];
    if (!value?.trim()) throw new Error(`--${flag} requires a value`);
    result[key] = value.trim(); // Flags deterministically override environment values.
  }
  return result;
}

export function validateOptions(options) {
  for (const key of ['baseURL', 'version', 'revision', 'provider']) {
    if (!options[key]) throw new Error(`missing required ${fields[key][1]}`);
  }
  let url;
  try {
    url = new URL(options.baseURL);
  } catch {
    throw new Error('base URL must be an absolute HTTP(S) URL');
  }
  if (!['http:', 'https:'].includes(url.protocol))
    throw new Error('base URL must be an absolute HTTP(S) URL');
  if (!/^[0-9a-f]{40}$/.test(options.revision))
    throw new Error(
      'expected revision must be a full lowercase 40-character Git SHA'
    );
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(options.version))
    throw new Error('expected version must be an exact semantic version');
  if (!['token-place', 'openai'].includes(options.provider))
    throw new Error('expected provider must be token-place or openai');
  if (options.provider === 'token-place') {
    if (!options.tokenPlaceOrigin || !options.tokenPlaceModel)
      throw new Error(
        'token-place provider requires expected origin and model'
      );
    const origin = new URL(options.tokenPlaceOrigin);
    if (
      origin.origin !== options.tokenPlaceOrigin ||
      !['http:', 'https:'].includes(origin.protocol)
    )
      throw new Error('token.place origin must contain only scheme and host');
  } else if (options.tokenPlaceOrigin || options.tokenPlaceModel) {
    throw new Error(
      'token.place expectations are inapplicable when expected provider is openai'
    );
  }
  return options;
}

export function buildEnv(options, env = process.env) {
  const host = new URL(options.baseURL).hostname;
  return {
    ...env,
    BASE_URL: options.baseURL,
    REMOTE_CHAT_SMOKE: '1',
    REMOTE_CHAT_SMOKE_USE_WEBSERVER: ['localhost', '127.0.0.1', '::1'].includes(
      host
    )
      ? '1'
      : '0',
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
    `[qa:remote-chat-smoke] target=${new URL(options.baseURL).origin} provider=${options.provider}`
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
  child.on('exit', (code) => {
    process.exitCode = code ?? 1;
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
