#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { open, rename, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendDir = join(scriptDir, '..', 'frontend');
const defaultIdentityContract = 'build-info-v1';
const legacyIdentityProfiles = [
  {
    version: '3.0.1',
    revision: '1a31a569aff2dbeb238e8c2688b9e85140d2077d',
    provider: 'openai',
    identityContract: 'legacy-build-meta-v1',
  },
  {
    version: '3.1.0',
    revision: '018687f5a7f4de45508c6e36eb28afb3e44da24d',
    provider: 'token-place',
    identityContract: 'legacy-build-meta-v1',
  },
];

const definitions = {
  baseURL: ['base-url', 'DSPACE_SMOKE_BASE_URL'],
  expectedVersion: ['expected-version', 'DSPACE_EXPECTED_VERSION'],
  expectedRevision: ['expected-revision', 'DSPACE_EXPECTED_REVISION'],
  identityContract: ['identity-contract', 'DSPACE_EXPECTED_IDENTITY_CONTRACT'],
  expectedProvider: ['expected-provider', 'DSPACE_EXPECTED_PROVIDER'],
  expectedTokenPlaceOrigin: [
    'expected-token-place-origin',
    'DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN',
  ],
  expectedTokenPlaceModel: [
    'expected-token-place-model',
    'DSPACE_EXPECTED_TOKEN_PLACE_MODEL',
  ],
  resultFile: ['result-file'],
  runnerRevision: ['runner-revision'],
};

export function parseAndValidateArgs(argv, env = process.env) {
  const flags = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith('--'))
      throw new Error('validation: unexpected positional argument');
    const equals = argument.indexOf('=');
    const name = argument.slice(2, equals === -1 ? undefined : equals);
    const definition = Object.values(definitions).find(
      ([flag]) => flag === name
    );
    if (!definition) throw new Error('validation: unknown flag');
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
  if (
    !flags.has(definitions.identityContract[0]) &&
    !Object.hasOwn(env, definitions.identityContract[1])
  ) {
    result.identityContract = defaultIdentityContract;
  }
  const missing = Object.entries(definitions)
    .filter(
      ([key]) =>
        !result[key] &&
        !key.startsWith('expectedTokenPlace') &&
        !['resultFile', 'runnerRevision'].includes(key)
    )
    .map(([, [, environment]]) => environment);
  if (missing.length)
    throw new Error(
      `validation: missing required input(s): ${missing.join(', ')}`
    );
  if (Boolean(result.resultFile) !== Boolean(result.runnerRevision)) {
    throw new Error(
      'validation: --result-file and --runner-revision must be supplied together'
    );
  }
  if (result.runnerRevision && !/^[0-9a-f]{40}$/.test(result.runnerRevision)) {
    throw new Error(
      'validation: runner revision must be a lowercase full 40-character Git SHA'
    );
  }

  let base;
  try {
    base = new URL(result.baseURL);
  } catch {
    throw new Error('validation: base URL must be an absolute http(s) URL');
  }
  if (
    !['http:', 'https:'].includes(base.protocol) ||
    base.username ||
    base.password ||
    base.pathname !== '/' ||
    base.search ||
    base.hash
  ) {
    throw new Error(
      'validation: base URL must be an absolute credential-free http(s) URL'
    );
  }
  result.baseURL = base.origin;
  const fault = env.DSPACE_REMOTE_CHAT_SMOKE_FAULT?.trim();
  const normalizedHostname = base.hostname.replace(/^\[|\]$/g, '');
  const localTarget =
    ['127.0.0.1', 'localhost', '0.0.0.0', '::1'].includes(normalizedHostname) ||
    normalizedHostname.endsWith('.local');
  if (fault) {
    if (
      !['hydration', 'submission'].includes(fault) ||
      env.CI !== 'true' ||
      !localTarget
    ) {
      throw new Error(
        'validation: smoke fault is restricted to bounded local CI cases'
      );
    }
    result.fault = fault;
  }
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
  if (
    !['build-info-v1', 'legacy-build-meta-v1'].includes(result.identityContract)
  ) {
    throw new Error('validation: identity contract is unsupported');
  }
  if (!['token-place', 'openai'].includes(result.expectedProvider)) {
    throw new Error(
      'validation: expected provider must be token-place or openai'
    );
  }
  if (
    result.identityContract === 'legacy-build-meta-v1' &&
    !legacyIdentityProfiles.some(
      (profile) =>
        result.expectedVersion === profile.version &&
        result.expectedRevision === profile.revision &&
        result.expectedProvider === profile.provider &&
        result.identityContract === profile.identityContract
    )
  ) {
    throw new Error('validation: legacy identity contract is restricted');
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
  const local =
    ['127.0.0.1', 'localhost', '0.0.0.0', '::1'].includes(hostname) ||
    hostname.endsWith('.local');
  return {
    ...baseEnv,
    PW_WORKERS: '1',
    BASE_URL: options.baseURL,
    REMOTE_CHAT_SMOKE: '1',
    REMOTE_CHAT_SMOKE_USE_WEBSERVER: local ? '1' : '0',
    PLAYWRIGHT_SKIP_INSTALL_DEPS: '1',
    DSPACE_EXPECTED_VERSION: options.expectedVersion,
    DSPACE_EXPECTED_REVISION: options.expectedRevision,
    DSPACE_EXPECTED_IDENTITY_CONTRACT: options.identityContract,
    DSPACE_EXPECTED_PROVIDER: options.expectedProvider,
    DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN: options.expectedTokenPlaceOrigin || '',
    DSPACE_EXPECTED_TOKEN_PLACE_MODEL: options.expectedTokenPlaceModel || '',
    DSPACE_REMOTE_CHAT_SMOKE_FAULT: options.fault || '',
  };
}

export async function publishResult(resultFile, runnerRevision, passed) {
  const temporaryFile = join(
    dirname(resultFile),
    `.dspace-chat-result-${process.pid}-${randomBytes(8).toString('hex')}.tmp`
  );
  const payload = `${JSON.stringify({
    schemaVersion: 1,
    journey: '/chat',
    passed,
    executedAt: Math.floor(Date.now() / 1000),
    runnerRevision,
    transport: 'intercepted',
    mutationEnabled: false,
  })}\n`;
  let handle;
  try {
    handle = await open(temporaryFile, 'wx', 0o600);
    await handle.writeFile(payload, 'utf8');
    await handle.sync();
    await handle.close();
    handle = undefined;
    await rename(temporaryFile, resultFile);
  } catch (error) {
    await handle?.close().catch(() => {});
    await unlink(temporaryFile).catch(() => {});
    throw error;
  }
}

export function runSmoke(options, dependencies = {}) {
  const spawnChild = dependencies.spawn ?? spawn;
  const writeResult = dependencies.publishResult ?? publishResult;
  const runtime = dependencies.process ?? process;
  const log = dependencies.log ?? console.log;
  const logError = dependencies.error ?? console.error;

  log(`[qa:remote-chat-smoke] target=${options.baseURL}`);
  log(`[qa:remote-chat-smoke] expectedVersion=${options.expectedVersion}`);
  log(`[qa:remote-chat-smoke] expectedRevision=${options.expectedRevision}`);
  log(`[qa:remote-chat-smoke] expectedProvider=${options.expectedProvider}`);
  log(
    '[qa:remote-chat-smoke] transport=intercepted; profile=isolated; mutation=disabled'
  );
  let child;
  try {
    child = spawnChild(
      'node',
      [
        './node_modules/@playwright/test/cli.js',
        'test',
        'e2e/remote-chat-smoke.spec.ts',
        '--project=chromium',
      ],
      { cwd: frontendDir, env: buildSmokeEnv(options), stdio: 'inherit' }
    );
  } catch (error) {
    if (!options.resultFile) throw error;
    logError('[qa:remote-chat-smoke] launch failed');
    runtime.exitCode = 1;
    return;
  }

  let launchFailed = false;
  child.on('error', (error) => {
    launchFailed = true;
    logError(`[qa:remote-chat-smoke] launch: ${error.message}`);
    runtime.exitCode = 1;
  });
  child.on('exit', async (code, signal) => {
    if (signal) {
      runtime.kill(runtime.pid, signal);
      return;
    }
    if (launchFailed || !Number.isInteger(code)) {
      runtime.exitCode = 1;
      return;
    }
    if (options.resultFile) {
      try {
        await writeResult(
          options.resultFile,
          options.runnerRevision,
          code === 0
        );
      } catch {
        logError('[qa:remote-chat-smoke] result publication failed');
        runtime.exitCode = 1;
        return;
      }
    }
    runtime.exitCode = code;
  });
  return child;
}

export function main(argv = process.argv.slice(2), dependencies = {}) {
  let options;
  try {
    options = parseAndValidateArgs(argv, dependencies.env ?? process.env);
  } catch (error) {
    (dependencies.error ?? console.error)(
      `[qa:remote-chat-smoke] ${error.message}`
    );
    (dependencies.process ?? process).exitCode = 2;
    return;
  }
  return runSmoke(options, dependencies);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
