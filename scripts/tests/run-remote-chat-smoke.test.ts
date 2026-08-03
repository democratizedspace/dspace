import { describe, expect, it } from 'vitest';
import {
  buildSmokeEnv,
  parseAndValidateArgs,
} from '../run-remote-chat-smoke.mjs';

const revision = '0123456789abcdef0123456789abcdef01234567';
const recoveryRevision = '1a31a569aff2dbeb238e8c2688b9e85140d2077d';
const completeEnv = {
  DSPACE_SMOKE_BASE_URL: 'https://staging.example.test',
  DSPACE_EXPECTED_VERSION: '3.1.0',
  DSPACE_EXPECTED_REVISION: revision,
  DSPACE_EXPECTED_PROVIDER: 'token-place',
  DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN: 'https://token.place',
  DSPACE_EXPECTED_TOKEN_PLACE_MODEL: 'llama-3.1-8b-instruct',
};

describe('remote chat smoke input validation', () => {
  it('always configures serial Playwright execution while preserving the environment', () => {
    const options = parseAndValidateArgs([], completeEnv);

    expect(
      buildSmokeEnv(options, { CUSTOM_SMOKE_VALUE: 'preserved' })
    ).toMatchObject({
      CUSTOM_SMOKE_VALUE: 'preserved',
      PW_WORKERS: '1',
    });
  });

  it.each(['2', '8'])(
    'overrides ambient PW_WORKERS=%s with serial execution',
    (workers) => {
      const options = parseAndValidateArgs([], completeEnv);

      expect(buildSmokeEnv(options, { PW_WORKERS: workers }).PW_WORKERS).toBe(
        '1'
      );
    }
  );

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

  it('accepts the legacy identity contract only for the recovery coordinates', () => {
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

  it('rejects token.place for the legacy OpenAI-only UI contract', () => {
    expect(() =>
      parseAndValidateArgs([], {
        ...completeEnv,
        DSPACE_EXPECTED_VERSION: '3.0.1',
        DSPACE_EXPECTED_REVISION: recoveryRevision,
        DSPACE_EXPECTED_IDENTITY_CONTRACT: 'legacy-build-meta-v1',
      })
    ).toThrow('legacy identity contract is restricted');
  });

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
