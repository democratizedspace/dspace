#!/usr/bin/env node

import { spawn } from 'node:child_process';
import {
  mkdtemp,
  open,
  readFile,
  rename,
  rm,
  stat,
  unlink,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendDir = join(scriptDir, '..', 'frontend');
const defaultIdentityContract = 'build-info-v1';
const completionMarker = 'dspace-remote-chat-smoke-journey-complete-v1\n';
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

const requiredKeys = new Set([
  'baseURL',
  'expectedVersion',
  'expectedRevision',
  'identityContract',
  'expectedProvider',
]);

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
    result[key] =
      flags.get(flag) ?? (environment ? env[environment]?.trim() : undefined);
  }
  if (
    !flags.has(definitions.identityContract[0]) &&
    !Object.hasOwn(env, definitions.identityContract[1])
  ) {
    result.identityContract = defaultIdentityContract;
  }
  const missing = Object.entries(definitions)
    .filter(([key]) => requiredKeys.has(key) && !result[key])
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

export function buildSmokeEnv(
  options,
  baseEnv = process.env,
  executionEvidence
) {
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
    ...(executionEvidence
      ? { DSPACE_REMOTE_CHAT_SMOKE_COMPLETION_FILE: executionEvidence.file }
      : {}),
  };
}

export async function publishResult(
  resultFile,
  runnerRevision,
  passed,
  now = Date.now
) {
  const result = {
    schemaVersion: 1,
    journey: '/chat',
    passed,
    executedAt: Math.floor(now() / 1000),
    runnerRevision,
    transport: 'intercepted',
    mutationEnabled: false,
  };
  const temporaryFile = join(
    dirname(resultFile),
    `.${basename(resultFile)}.${process.pid}.${randomBytes(8).toString('hex')}.tmp`
  );
  let handle;
  try {
    handle = await open(temporaryFile, 'wx', 0o600);
    await handle.writeFile(`${JSON.stringify(result)}\n`, 'utf8');
    await handle.sync();
    await handle.close();
    handle = undefined;
    await rename(temporaryFile, resultFile);
  } catch (error) {
    if (handle) await handle.close().catch(() => {});
    await unlink(temporaryFile).catch(() => {});
    throw error;
  }
}

export async function runSmoke(
  options,
  {
    spawnImpl = spawn,
    publishResultImpl = publishResult,
    relaySignal = (signal) => process.kill(process.pid, signal),
  } = {}
) {
  const evidenceDirectory = options.resultFile
    ? await mkdtemp(join(tmpdir(), 'dspace-chat-smoke-'))
    : undefined;
  return new Promise((resolve) => {
    let launchFailed = false;
    let launchError;
    // Some filesystems expose modification times at one-second granularity.
    const evidenceNotBefore = Date.now() - 2000;
    const executionEvidence = evidenceDirectory
      ? { file: join(evidenceDirectory, 'completion') }
      : undefined;
    const removeExecutionEvidence = () =>
      evidenceDirectory
        ? rm(evidenceDirectory, { recursive: true, force: true }).catch(
            () => {}
          )
        : Promise.resolve();
    let child;
    try {
      child = spawnImpl(
        'node',
        [
          './node_modules/@playwright/test/cli.js',
          'test',
          'e2e/remote-chat-smoke.spec.ts',
          '--project=chromium',
        ],
        {
          cwd: frontendDir,
          env: buildSmokeEnv(options, process.env, executionEvidence),
          stdio: 'inherit',
        }
      );
    } catch (error) {
      void removeExecutionEvidence().then(() =>
        resolve({ kind: 'launch-failure', exitCode: 1, error })
      );
      return;
    }
    child.once('error', (error) => {
      launchFailed = true;
      launchError = error;
    });
    child.once('close', async (code, signal) => {
      if (launchFailed) {
        await removeExecutionEvidence();
        resolve({ kind: 'launch-failure', exitCode: 1, error: launchError });
        return;
      }
      if (signal) {
        await removeExecutionEvidence();
        resolve({ kind: 'signal', signal });
        relaySignal(signal);
        return;
      }
      const exitCode = code ?? 1;
      if (options.resultFile) {
        let executed = false;
        try {
          const markerStat = await stat(executionEvidence.file);
          if (
            markerStat.isFile() &&
            markerStat.size === Buffer.byteLength(completionMarker) &&
            markerStat.mtimeMs >= evidenceNotBefore
          ) {
            executed =
              (await readFile(executionEvidence.file, 'utf8')) ===
              completionMarker;
          }
        } catch {
          // Missing, malformed, or unreadable evidence means the journey did not complete.
        }
        await removeExecutionEvidence();
        if (!executed) {
          resolve({ kind: 'incomplete', exitCode: exitCode || 1 });
          return;
        }
        try {
          await publishResultImpl(
            options.resultFile,
            options.runnerRevision,
            exitCode === 0
          );
        } catch {
          resolve({ kind: 'publication-failure', exitCode: exitCode || 1 });
          return;
        }
      }
      resolve({ kind: 'completed', exitCode });
    });
  });
}

export async function main(argv = process.argv.slice(2)) {
  let options;
  try {
    options = parseAndValidateArgs(argv);
  } catch (error) {
    console.error(`[qa:remote-chat-smoke] ${error.message}`);
    process.exitCode = 2;
    return 2;
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
  const outcome = await runSmoke(options);
  if (outcome.kind === 'launch-failure') {
    console.error(`[qa:remote-chat-smoke] launch: ${outcome.error.message}`);
  } else if (outcome.kind === 'publication-failure') {
    console.error('[qa:remote-chat-smoke] result publication failed');
  } else if (outcome.kind === 'incomplete') {
    console.error(
      '[qa:remote-chat-smoke] journey completion was not confirmed; result preserved'
    );
  }
  if ('exitCode' in outcome) process.exitCode = outcome.exitCode;
  return outcome.exitCode;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
