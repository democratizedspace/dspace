import { EventEmitter } from 'node:events';
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  buildSmokeEnv,
  main,
  parseAndValidateArgs,
  publishResult,
  runSmoke,
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

  it('requires paired result options and validates the runner full SHA', () => {
    expect(() =>
      parseAndValidateArgs(['--result-file=/tmp/result.json'], completeEnv)
    ).toThrow('must be supplied together');
    expect(() =>
      parseAndValidateArgs(['--runner-revision', revision], completeEnv)
    ).toThrow('must be supplied together');
    for (const invalid of [
      revision.slice(1),
      revision.toUpperCase(),
      `${revision}0`,
    ]) {
      expect(() =>
        parseAndValidateArgs(
          ['--result-file=/tmp/result.json', '--runner-revision', invalid],
          completeEnv
        )
      ).toThrow('lowercase full 40-character');
    }
    expect(
      parseAndValidateArgs(
        ['--result-file=/tmp/result.json', '--runner-revision', revision],
        completeEnv
      )
    ).toMatchObject({
      resultFile: '/tmp/result.json',
      runnerRevision: revision,
    });
  });
});

function fakeRuntime() {
  return { exitCode: undefined, kill: vi.fn(), pid: 1234 };
}

function smokeOptions(resultFile?: string) {
  return {
    ...parseAndValidateArgs([], completeEnv),
    ...(resultFile ? { resultFile, runnerRevision: revision } : {}),
  };
}

describe('remote chat smoke result publication', () => {
  it('atomically replaces a result with the exact successful schema and restrictive mode', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'dspace-chat-result-'));
    const destination = join(directory, 'result.json');
    await writeFile(destination, 'stale\n', { mode: 0o666 });

    const child = new EventEmitter();
    const runtime = fakeRuntime();
    runSmoke(smokeOptions(destination), {
      spawn: () => child,
      process: runtime,
      log: vi.fn(),
      error: vi.fn(),
    });
    child.emit('exit', 0, null);
    await vi.waitFor(() => expect(runtime.exitCode).toBe(0));

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

  it('publishes passed=false after completed failure and retains the child status', async () => {
    const child = new EventEmitter();
    const runtime = fakeRuntime();
    const write = vi.fn().mockResolvedValue(undefined);
    runSmoke(smokeOptions('/tmp/result.json'), {
      spawn: () => child,
      publishResult: write,
      process: runtime,
      log: vi.fn(),
      error: vi.fn(),
    });

    child.emit('exit', 7, null);
    await vi.waitFor(() =>
      expect(write).toHaveBeenCalledWith('/tmp/result.json', revision, false)
    );
    expect(runtime.exitCode).toBe(7);
  });

  it.each([
    [
      'launch error',
      (child: EventEmitter) => child.emit('error', new Error('private')),
    ],
    ['signal', (child: EventEmitter) => child.emit('exit', null, 'SIGTERM')],
    [
      'incomplete exit',
      (child: EventEmitter) => child.emit('exit', null, null),
    ],
  ])('preserves an existing result on %s', async (_case, finish) => {
    const child = new EventEmitter();
    const runtime = fakeRuntime();
    const write = vi.fn();
    runSmoke(smokeOptions('/tmp/result.json'), {
      spawn: () => child,
      publishResult: write,
      process: runtime,
      log: vi.fn(),
      error: vi.fn(),
    });
    finish(child);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(write).not.toHaveBeenCalled();
  });

  it('does not launch or replace a result on validation failure', () => {
    const runtime = fakeRuntime();
    const spawn = vi.fn();
    main(['--result-file=/tmp/result.json'], {
      env: completeEnv,
      spawn,
      process: runtime,
      error: vi.fn(),
    });
    expect(spawn).not.toHaveBeenCalled();
    expect(runtime.exitCode).toBe(2);
  });

  it('does not create a result when spawn throws and emits only a bounded error', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'dspace-chat-result-'));
    const destination = join(directory, 'result.json');
    const runtime = fakeRuntime();
    const error = vi.fn();
    const write = vi.fn();
    runSmoke(smokeOptions(destination), {
      spawn: () => {
        throw new Error('secret launch detail');
      },
      publishResult: write,
      process: runtime,
      log: vi.fn(),
      error,
    });
    expect(write).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith('[qa:remote-chat-smoke] launch failed');
    expect(runtime.exitCode).toBe(1);
    await expect(stat(destination)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('fails closed with a bounded error when publication fails', async () => {
    const child = new EventEmitter();
    const runtime = fakeRuntime();
    const error = vi.fn();
    runSmoke(smokeOptions('/unwritable/result.json'), {
      spawn: () => child,
      publishResult: vi
        .fn()
        .mockRejectedValue(new Error('private path detail')),
      process: runtime,
      log: vi.fn(),
      error,
    });
    child.emit('exit', 0, null);
    await vi.waitFor(() => expect(runtime.exitCode).toBe(1));
    expect(error).toHaveBeenCalledWith(
      '[qa:remote-chat-smoke] result publication failed'
    );
  });

  it('keeps legacy invocation and serial intercepted mutation-disabled execution unchanged', () => {
    const child = new EventEmitter();
    const runtime = fakeRuntime();
    const spawn = vi.fn((..._args: unknown[]) => child);
    const write = vi.fn();
    runSmoke(smokeOptions(), {
      spawn,
      publishResult: write,
      process: runtime,
      log: vi.fn(),
      error: vi.fn(),
    });
    const [command, args, configuration] = spawn.mock.calls[0] as [
      string,
      string[],
      { env: Record<string, string> },
    ];
    expect(command).toBe('node');
    expect(args).toEqual([
      './node_modules/@playwright/test/cli.js',
      'test',
      'e2e/remote-chat-smoke.spec.ts',
      '--project=chromium',
    ]);
    expect(configuration.env).toMatchObject({
      PW_WORKERS: '1',
      REMOTE_CHAT_SMOKE: '1',
    });
    child.emit('exit', 0, null);
    expect(write).not.toHaveBeenCalled();
    expect(runtime.exitCode).toBe(0);
  });

  it('cleans up a temporary file when atomic replacement fails', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'dspace-chat-result-'));
    const destination = join(directory, 'result.json');
    await mkdir(destination);
    await expect(publishResult(destination, revision, true)).rejects.toThrow();
    expect(await readdir(directory)).toEqual(['result.json']);
  });
});
