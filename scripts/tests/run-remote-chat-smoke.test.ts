import { EventEmitter } from 'node:events';
import { mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  buildSmokeEnv,
  parseAndValidateArgs,
  runSmoke,
  writeResultAtomically,
} from '../run-remote-chat-smoke.mjs';

const revision = '0123456789abcdef0123456789abcdef01234567';
const recoveryRevision = '1a31a569aff2dbeb238e8c2688b9e85140d2077d';
const legacyTokenPlaceRevision = '018687f5a7f4de45508c6e36eb28afb3e44da24d';
const completeEnv = {
  DSPACE_SMOKE_BASE_URL: 'https://staging.example.test',
  DSPACE_EXPECTED_VERSION: '3.1.0',
  DSPACE_EXPECTED_REVISION: revision,
  DSPACE_EXPECTED_PROVIDER: 'token-place',
  DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN: 'https://token.place',
  DSPACE_EXPECTED_TOKEN_PLACE_MODEL: 'qwen3-8b-instruct',
};

describe('remote chat smoke input validation', () => {
  it('selects serial Playwright execution by default', () => {
    const options = parseAndValidateArgs([], completeEnv);
    expect(buildSmokeEnv(options, {}).PW_WORKERS).toBe('1');
  });

  it('overrides ambient Playwright worker settings while preserving the environment', () => {
    const options = parseAndValidateArgs([], completeEnv);
    const smokeEnv = buildSmokeEnv(options, {
      PW_WORKERS: '8',
      OPERATOR_CONTEXT: 'preserved',
    });
    expect(smokeEnv).toMatchObject({
      PW_WORKERS: '1',
      OPERATOR_CONTEXT: 'preserved',
    });
  });

  it('accepts the documented environment and configures remote mode', () => {
    const options = parseAndValidateArgs([], completeEnv);
    expect(options.expectedProvider).toBe('token-place');
    expect(options.identityContract).toBe('build-info-v1');
    expect(buildSmokeEnv(options, {}).REMOTE_CHAT_SMOKE_USE_WEBSERVER).toBe(
      '0'
    );
  });

  it('accepts the explicit modern identity contract', () => {
    expect(
      parseAndValidateArgs([], {
        ...completeEnv,
        DSPACE_EXPECTED_IDENTITY_CONTRACT: 'build-info-v1',
      }).identityContract
    ).toBe('build-info-v1');
  });

  it('accepts the legacy identity contract for the 3.0.1 OpenAI recovery coordinates', () => {
    const legacyEnv = {
      ...completeEnv,
      DSPACE_EXPECTED_VERSION: '3.0.1',
      DSPACE_EXPECTED_REVISION: recoveryRevision,
      DSPACE_EXPECTED_IDENTITY_CONTRACT: 'legacy-build-meta-v1',
      DSPACE_EXPECTED_PROVIDER: 'openai',
    };
    delete legacyEnv.DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN;
    delete legacyEnv.DSPACE_EXPECTED_TOKEN_PLACE_MODEL;
    const options = parseAndValidateArgs([], {
      ...legacyEnv,
    });
    expect(options.identityContract).toBe('legacy-build-meta-v1');
    expect(buildSmokeEnv(options, {}).DSPACE_EXPECTED_IDENTITY_CONTRACT).toBe(
      'legacy-build-meta-v1'
    );
  });

  it('accepts the legacy identity contract for the exact 3.1.0 token.place profile', () => {
    const options = parseAndValidateArgs([], {
      ...completeEnv,
      DSPACE_EXPECTED_VERSION: '3.1.0',
      DSPACE_EXPECTED_REVISION: legacyTokenPlaceRevision,
      DSPACE_EXPECTED_IDENTITY_CONTRACT: 'legacy-build-meta-v1',
      DSPACE_EXPECTED_PROVIDER: 'token-place',
      DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN: 'https://token.place',
      DSPACE_EXPECTED_TOKEN_PLACE_MODEL: 'llama-3.1-8b-instruct',
    });
    expect(options.identityContract).toBe('legacy-build-meta-v1');
    expect(options.expectedProvider).toBe('token-place');
    expect(buildSmokeEnv(options, {})).toMatchObject({
      DSPACE_EXPECTED_IDENTITY_CONTRACT: 'legacy-build-meta-v1',
      DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN: 'https://token.place',
      DSPACE_EXPECTED_TOKEN_PLACE_MODEL: 'llama-3.1-8b-instruct',
      PW_WORKERS: '1',
    });
  });

  it.each([
    ['3.0.2', recoveryRevision],
    ['3.0.1', revision],
  ])(
    'rejects legacy identity for version %s and revision %s',
    (version, sha) => {
      expect(() =>
        parseAndValidateArgs([], {
          ...completeEnv,
          DSPACE_EXPECTED_VERSION: version,
          DSPACE_EXPECTED_REVISION: sha,
          DSPACE_EXPECTED_IDENTITY_CONTRACT: 'legacy-build-meta-v1',
        })
      ).toThrow('legacy identity contract is restricted');
    }
  );

  it('rejects 3.0.1 with token.place for the legacy identity contract', () => {
    expect(() =>
      parseAndValidateArgs([], {
        ...completeEnv,
        DSPACE_EXPECTED_VERSION: '3.0.1',
        DSPACE_EXPECTED_REVISION: recoveryRevision,
        DSPACE_EXPECTED_IDENTITY_CONTRACT: 'legacy-build-meta-v1',
      })
    ).toThrow('legacy identity contract is restricted');
  });

  it('rejects 3.1.0 with OpenAI for the legacy identity contract', () => {
    const env = {
      ...completeEnv,
      DSPACE_EXPECTED_VERSION: '3.1.0',
      DSPACE_EXPECTED_REVISION: legacyTokenPlaceRevision,
      DSPACE_EXPECTED_IDENTITY_CONTRACT: 'legacy-build-meta-v1',
      DSPACE_EXPECTED_PROVIDER: 'openai',
    };
    delete env.DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN;
    delete env.DSPACE_EXPECTED_TOKEN_PLACE_MODEL;
    expect(() => parseAndValidateArgs([], env)).toThrow(
      'legacy identity contract is restricted'
    );
  });

  it.each([
    ['3.0.1 OpenAI version', '3.0.2', recoveryRevision, 'openai'],
    ['3.0.1 OpenAI revision', '3.0.1', revision, 'openai'],
    ['3.0.1 OpenAI provider', '3.0.1', recoveryRevision, 'token-place'],
    [
      '3.1.0 token.place version',
      '3.1.1',
      legacyTokenPlaceRevision,
      'token-place',
    ],
    ['3.1.0 token.place revision', '3.1.0', revision, 'token-place'],
    ['3.1.0 token.place provider', '3.1.0', legacyTokenPlaceRevision, 'openai'],
  ])(
    'rejects one-field legacy profile drift for %s',
    (_name, version, sha, provider) => {
      const env = {
        ...completeEnv,
        DSPACE_EXPECTED_VERSION: version,
        DSPACE_EXPECTED_REVISION: sha,
        DSPACE_EXPECTED_IDENTITY_CONTRACT: 'legacy-build-meta-v1',
        DSPACE_EXPECTED_PROVIDER: provider,
      };
      if (provider === 'openai') {
        delete env.DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN;
        delete env.DSPACE_EXPECTED_TOKEN_PLACE_MODEL;
      }
      expect(() => parseAndValidateArgs([], env)).toThrow(
        'legacy identity contract is restricted'
      );
    }
  );

  it('rejects unknown, empty, and contradictory identity contracts', () => {
    expect(() =>
      parseAndValidateArgs([], {
        ...completeEnv,
        DSPACE_EXPECTED_IDENTITY_CONTRACT: 'unknown-contract',
      })
    ).toThrow('identity contract is unsupported');
    expect(() =>
      parseAndValidateArgs([], {
        ...completeEnv,
        DSPACE_EXPECTED_IDENTITY_CONTRACT: '',
      })
    ).toThrow('missing required input');
    expect(() =>
      parseAndValidateArgs(
        [
          '--identity-contract=build-info-v1',
          '--identity-contract=legacy-build-meta-v1',
        ],
        completeEnv
      )
    ).toThrow('contradictory values');
  });

  it('propagates the default modern identity contract', () => {
    const options = parseAndValidateArgs([], completeEnv);
    expect(buildSmokeEnv(options, {}).DSPACE_EXPECTED_IDENTITY_CONTRACT).toBe(
      'build-info-v1'
    );
  });

  it.each([
    'http://127.0.0.1:4173',
    'http://localhost:4173',
    'http://0.0.0.0:4173',
    'http://[::1]:4173',
    'http://dspace.local:4173',
  ])('enables the managed web server for loopback URL %s', (baseURL) => {
    const options = parseAndValidateArgs([], {
      ...completeEnv,
      DSPACE_SMOKE_BASE_URL: baseURL,
    });
    expect(buildSmokeEnv(options, {}).REMOTE_CHAT_SMOKE_USE_WEBSERVER).toBe(
      '1'
    );
  });

  it('gives flags deterministic precedence over environment values', () => {
    const options = parseAndValidateArgs(
      ['--expected-version=3.2.0'],
      completeEnv
    );
    expect(options.expectedVersion).toBe('3.2.0');
  });

  it.each([
    [
      { ...completeEnv, DSPACE_EXPECTED_REVISION: revision.slice(0, 7) },
      'full 40-character',
    ],
    [
      { ...completeEnv, DSPACE_EXPECTED_PROVIDER: 'other' },
      'token-place or openai',
    ],
    [
      {
        ...completeEnv,
        DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN: 'https://token.place/path',
      },
      'only scheme',
    ],
    [
      { ...completeEnv, DSPACE_EXPECTED_TOKEN_PLACE_MODEL: '' },
      'token-place requires',
    ],
    [
      { ...completeEnv, DSPACE_SMOKE_BASE_URL: 'token.place' },
      'absolute http(s)',
    ],
    [
      {
        ...completeEnv,
        DSPACE_SMOKE_BASE_URL: 'https://example.test/path?opaque=value',
      },
      'credential-free http(s)',
    ],
  ])('rejects malformed input without launching Playwright', (env, message) => {
    expect(() => parseAndValidateArgs([], env)).toThrow(message);
  });

  it('rejects provider-inapplicable and contradictory inputs', () => {
    expect(() =>
      parseAndValidateArgs([], {
        ...completeEnv,
        DSPACE_EXPECTED_PROVIDER: 'openai',
      })
    ).toThrow('inapplicable');
    expect(() =>
      parseAndValidateArgs(
        ['--expected-version=3.1.0', '--expected-version=3.2.0'],
        completeEnv
      )
    ).toThrow('contradictory');
  });

  it('keeps malformed-input diagnostics bounded and free of supplied values', () => {
    const sentinel = 'operator-private-query-sentinel';
    for (const argv of [
      [sentinel],
      [`--unknown=${sentinel}`],
      [`--identity-contract=${sentinel}`],
    ]) {
      let message = '';
      try {
        parseAndValidateArgs(argv, completeEnv);
      } catch (error) {
        message = String(error.message);
      }
      expect(message).toContain('validation:');
      expect(message).not.toContain(sentinel);
      expect(message.length).toBeLessThan(100);
    }
  });

  it('restricts bounded fault injection to local CI runs', () => {
    expect(() =>
      parseAndValidateArgs([], {
        ...completeEnv,
        DSPACE_REMOTE_CHAT_SMOKE_FAULT: 'hydration',
      })
    ).toThrow('bounded local CI');
    const options = parseAndValidateArgs([], {
      ...completeEnv,
      CI: 'true',
      DSPACE_SMOKE_BASE_URL: 'http://127.0.0.1:4173',
      DSPACE_REMOTE_CHAT_SMOKE_FAULT: 'submission',
    });
    expect(buildSmokeEnv(options, {}).DSPACE_REMOTE_CHAT_SMOKE_FAULT).toBe(
      'submission'
    );
  });

  it('accepts OpenAI only when token.place expectations are absent', () => {
    const env = { ...completeEnv, DSPACE_EXPECTED_PROVIDER: 'openai' };
    delete env.DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN;
    delete env.DSPACE_EXPECTED_TOKEN_PLACE_MODEL;
    expect(parseAndValidateArgs([], env).expectedProvider).toBe('openai');
  });
});

const runnerRevision = 'abcdef0123456789abcdef0123456789abcdef01';

function completedChild(
  code: number | null,
  signal: NodeJS.Signals | null = null
) {
  const child = new EventEmitter();
  queueMicrotask(() => child.emit('exit', code, signal));
  return child;
}

function resultOptions(resultFile: string) {
  return parseAndValidateArgs(
    ['--result-file', resultFile, '--runner-revision', runnerRevision],
    completeEnv
  );
}

describe('remote chat smoke result contract', () => {
  it('requires paired result options and validates the runner full SHA', () => {
    expect(() =>
      parseAndValidateArgs(['--result-file', '/tmp/result.json'], completeEnv)
    ).toThrow('must be supplied together');
    expect(() =>
      parseAndValidateArgs(
        [
          '--result-file',
          '/tmp/result.json',
          '--runner-revision',
          revision.toUpperCase(),
        ],
        completeEnv
      )
    ).toThrow('lowercase full 40-character');
  });

  it('emits the exact successful schema after completed execution', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'dspace-chat-result-'));
    const resultFile = join(directory, 'result.json');
    const exitCode = await runSmoke(resultOptions(resultFile), {
      spawnImpl: () => completedChild(0),
      now: () => 1_785_988_800_999,
    });

    expect(exitCode).toBe(0);
    const raw = await readFile(resultFile, 'utf8');
    expect(raw.endsWith('\n')).toBe(true);
    const result = JSON.parse(raw);
    expect(result).toEqual({
      schemaVersion: 1,
      journey: '/chat',
      passed: true,
      executedAt: 1_785_988_800,
      runnerRevision,
      transport: 'intercepted',
      mutationEnabled: false,
    });
    expect(Object.keys(result)).toEqual([
      'schemaVersion',
      'journey',
      'passed',
      'executedAt',
      'runnerRevision',
      'transport',
      'mutationEnabled',
    ]);
    if (process.platform !== 'win32') {
      expect((await stat(resultFile)).mode & 0o777).toBe(0o600);
    }
  });

  it('publishes a failed completed result and retains the child status', async () => {
    const publishResult = vi.fn().mockResolvedValue(undefined);
    const options = resultOptions('/tmp/result.json');
    await expect(
      runSmoke(options, { spawnImpl: () => completedChild(7), publishResult })
    ).resolves.toBe(7);
    expect(publishResult).toHaveBeenCalledWith(
      options.resultFile,
      expect.objectContaining({ passed: false })
    );
  });

  it('atomically replaces an existing result', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'dspace-chat-replace-'));
    const resultFile = join(directory, 'result.json');
    await writeFile(resultFile, '{"old":true}\n');
    await writeResultAtomically(resultFile, { bounded: true });
    expect(await readFile(resultFile, 'utf8')).toBe('{"bounded":true}\n');
  });

  it.each([
    [
      'launch error',
      (child: EventEmitter) => child.emit('error', new Error('private detail')),
    ],
    ['signal', (child: EventEmitter) => child.emit('exit', null, 'SIGTERM')],
  ])('preserves an existing result on %s', async (_name, complete) => {
    const child = new EventEmitter();
    const publishResult = vi.fn();
    const relaySignal = vi.fn();
    const pending = runSmoke(resultOptions('/tmp/result.json'), {
      spawnImpl: () => child,
      publishResult,
      relaySignal,
    });
    complete(child);
    await pending;
    expect(publishResult).not.toHaveBeenCalled();
  });

  it('does not publish when launch throws', async () => {
    const publishResult = vi.fn();
    await expect(
      runSmoke(resultOptions('/tmp/result.json'), {
        spawnImpl: () => {
          throw new Error('spawn failure');
        },
        publishResult,
      })
    ).resolves.toBe(1);
    expect(publishResult).not.toHaveBeenCalled();
  });

  it('fails closed when publication fails after completion', async () => {
    await expect(
      runSmoke(resultOptions('/tmp/result.json'), {
        spawnImpl: () => completedChild(0),
        publishResult: () => Promise.reject(new Error('filesystem detail')),
      })
    ).resolves.toBe(1);
  });

  it('preserves legacy execution and serial intercepted invariants', async () => {
    let invocation: any[] = [];
    const options = parseAndValidateArgs([], completeEnv);
    await expect(
      runSmoke(options, {
        spawnImpl: (...args: any[]) => {
          invocation = args;
          return completedChild(0);
        },
      })
    ).resolves.toBe(0);
    expect(invocation[1]).toEqual([
      './node_modules/@playwright/test/cli.js',
      'test',
      'e2e/remote-chat-smoke.spec.ts',
      '--project=chromium',
    ]);
    expect(invocation[2].env).toMatchObject({
      PW_WORKERS: '1',
      REMOTE_CHAT_SMOKE: '1',
    });
    expect(options.resultFile).toBeUndefined();
  });
});
