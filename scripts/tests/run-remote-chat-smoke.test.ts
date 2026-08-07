import { EventEmitter } from 'node:events';
import { access, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildSmokeEnv,
  main,
  parseAndValidateArgs,
  writeResultFile,
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

const runnerArgs = [
  '--base-url=https://staging.example.test',
  '--expected-version=3.2.0',
  `--expected-revision=${revision}`,
  '--expected-provider=openai',
];

function completingSpawn(
  code: number | null,
  signal: NodeJS.Signals | null = null
) {
  return vi.fn((..._args: unknown[]) => {
    const child = new EventEmitter();
    queueMicrotask(() => child.emit('close', code, signal));
    return child;
  });
}

afterEach(() => {
  process.exitCode = 0;
  vi.restoreAllMocks();
});

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

  it('requires the result options as a pair and validates a lowercase full SHA', () => {
    expect(() =>
      parseAndValidateArgs(
        [...runnerArgs, '--result-file=/tmp/result.json'],
        {}
      )
    ).toThrow('must be supplied together');
    expect(() =>
      parseAndValidateArgs([...runnerArgs, `--runner-revision=${revision}`], {})
    ).toThrow('must be supplied together');
    for (const invalid of [
      revision.slice(1),
      revision.toUpperCase(),
      `${revision}0`,
    ]) {
      expect(() =>
        parseAndValidateArgs(
          [
            ...runnerArgs,
            '--result-file=/tmp/result.json',
            `--runner-revision=${invalid}`,
          ],
          {}
        )
      ).toThrow('lowercase full 40-character');
    }
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

describe('remote chat smoke result publication', () => {
  it('publishes passed true after a successful completed smoke', async () => {
    const publishResult = vi.fn().mockResolvedValue(undefined);
    expect(
      await main(
        [
          ...runnerArgs,
          '--result-file=/tmp/result.json',
          `--runner-revision=${revision}`,
        ],
        { spawnImpl: completingSpawn(0), publishResult }
      )
    ).toBe(0);
    expect(publishResult).toHaveBeenCalledWith(
      '/tmp/result.json',
      revision,
      true
    );
  });

  it('atomically replaces a result with the exact successful schema and restrictive mode', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'dspace-chat-result-'));
    const destination = join(directory, 'result.json');
    await writeFile(destination, '{"stale":true}\n');

    await writeResultFile(destination, revision, true);

    const raw = await readFile(destination, 'utf8');
    const result = JSON.parse(raw);
    expect(raw.endsWith('\n')).toBe(true);
    expect(Object.keys(result)).toEqual([
      'schemaVersion',
      'journey',
      'passed',
      'executedAt',
      'runnerRevision',
      'transport',
      'mutationEnabled',
    ]);
    expect(result).toEqual({
      schemaVersion: 1,
      journey: '/chat',
      passed: true,
      executedAt: expect.any(Number),
      runnerRevision: revision,
      transport: 'intercepted',
      mutationEnabled: false,
    });
    expect(Number.isInteger(result.executedAt)).toBe(true);
    if (process.platform !== 'win32') {
      expect((await stat(destination)).mode & 0o777).toBe(0o600);
    }
  });

  it('publishes passed false and preserves a completed child failure status', async () => {
    const publishResult = vi.fn().mockResolvedValue(undefined);
    const code = await main(
      [
        ...runnerArgs,
        '--result-file=/tmp/result.json',
        `--runner-revision=${revision}`,
      ],
      { spawnImpl: completingSpawn(7), publishResult }
    );
    expect(code).toBe(7);
    expect(process.exitCode).toBe(7);
    expect(publishResult).toHaveBeenCalledWith(
      '/tmp/result.json',
      revision,
      false
    );
  });

  it('does not publish on validation failure, launch failure, or signal', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    for (const [args, spawnImpl] of [
      [[...runnerArgs, '--result-file=/tmp/result.json'], completingSpawn(0)],
      [
        [
          ...runnerArgs,
          '--result-file=/tmp/result.json',
          `--runner-revision=${revision}`,
        ],
        () => {
          throw new Error('private launch detail');
        },
      ],
    ] as const) {
      const publishResult = vi.fn();
      await main(args, { spawnImpl, publishResult });
      expect(publishResult).not.toHaveBeenCalled();
    }

    const publishResult = vi.fn();
    const forwardSignal = vi.fn();
    await main(
      [
        ...runnerArgs,
        '--result-file=/tmp/result.json',
        `--runner-revision=${revision}`,
      ],
      {
        spawnImpl: completingSpawn(null, 'SIGTERM'),
        publishResult,
        forwardSignal,
      }
    );
    expect(publishResult).not.toHaveBeenCalled();
    expect(forwardSignal).toHaveBeenCalledWith('SIGTERM');
  });

  it('preserves an existing result and creates none when execution is incomplete', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const directory = await mkdtemp(join(tmpdir(), 'dspace-chat-incomplete-'));
    const existing = join(directory, 'existing.json');
    const absent = join(directory, 'absent.json');
    await writeFile(existing, '{"known":"stale"}\n');
    const launchFailure = () => {
      throw new Error('launch failure');
    };

    for (const destination of [existing, absent]) {
      await main(
        [
          ...runnerArgs,
          `--result-file=${destination}`,
          `--runner-revision=${revision}`,
        ],
        { spawnImpl: launchFailure }
      );
    }

    expect(await readFile(existing, 'utf8')).toBe('{"known":"stale"}\n');
    await expect(access(absent)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('fails closed with a bounded diagnostic when result publication fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const code = await main(
      [
        ...runnerArgs,
        '--result-file=/unwritable/result.json',
        `--runner-revision=${revision}`,
      ],
      {
        spawnImpl: completingSpawn(0),
        publishResult: vi.fn().mockRejectedValue(new Error('secret detail')),
      }
    );
    expect(code).toBe(1);
    expect(error).toHaveBeenCalledWith(
      '[qa:remote-chat-smoke] result publication failed'
    );
    expect(error.mock.calls.flat().join(' ')).not.toContain('secret detail');
  });

  it('keeps legacy invocations output-free and preserves serial intercepted guarantees', async () => {
    const spawnImpl = completingSpawn(0);
    expect(await main(runnerArgs, { spawnImpl })).toBe(0);
    const [, playwrightArgs, spawnOptions] = spawnImpl.mock.calls[0] as [
      string,
      string[],
      { env: Record<string, string> },
    ];
    expect(playwrightArgs).toEqual([
      './node_modules/@playwright/test/cli.js',
      'test',
      'e2e/remote-chat-smoke.spec.ts',
      '--project=chromium',
    ]);
    expect(spawnOptions.env).toMatchObject({
      PW_WORKERS: '1',
      REMOTE_CHAT_SMOKE: '1',
    });
  });
});
