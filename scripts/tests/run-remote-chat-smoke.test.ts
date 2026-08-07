import { describe, expect, it } from 'vitest';
import {
  buildSmokeEnv,
  parseAndValidateArgs,
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

  it('requires result output options as a pair', () => {
    expect(() =>
      parseAndValidateArgs(['--result-file=/tmp/result.json'], completeEnv)
    ).toThrow('--result-file and --runner-revision');
    expect(() =>
      parseAndValidateArgs(['--runner-revision', revision], completeEnv)
    ).toThrow('--result-file and --runner-revision');
  });

  it.each([
    revision.toUpperCase(),
    revision.slice(1),
    `${revision}0`,
    'x'.repeat(40),
  ])('rejects malformed runner revision %s', (runnerRevision) => {
    expect(() =>
      parseAndValidateArgs(
        [
          '--result-file=/tmp/result.json',
          `--runner-revision=${runnerRevision}`,
        ],
        completeEnv
      )
    ).toThrow('lowercase full 40-character Git SHA');
  });

  it('accepts paired result output options without changing the smoke environment', () => {
    const legacy = parseAndValidateArgs([], completeEnv);
    const withResult = parseAndValidateArgs(
      ['--result-file=/tmp/result.json', `--runner-revision=${revision}`],
      completeEnv
    );
    expect(withResult).toMatchObject({
      resultFile: '/tmp/result.json',
      runnerRevision: revision,
    });
    expect(buildSmokeEnv(withResult, {})).toEqual(buildSmokeEnv(legacy, {}));
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
