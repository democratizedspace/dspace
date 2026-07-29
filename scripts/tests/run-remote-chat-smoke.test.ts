import { describe, expect, it } from 'vitest';
import {
  buildEnv,
  parseArgs,
  validateOptions,
} from '../run-remote-chat-smoke.mjs';

const valid = {
  DSPACE_SMOKE_BASE_URL: 'https://staging.example.test',
  DSPACE_EXPECTED_VERSION: '3.1.0',
  DSPACE_EXPECTED_REVISION: 'a'.repeat(40),
  DSPACE_EXPECTED_PROVIDER: 'token-place',
  DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN: 'https://token.place',
  DSPACE_EXPECTED_TOKEN_PLACE_MODEL: 'llama-3.1-8b-instruct',
};

describe('remote chat smoke argument validation', () => {
  it('uses flags in preference to environment', () => {
    expect(parseArgs(['--expected-version=3.2.0'], valid).version).toBe(
      '3.2.0'
    );
  });

  it('accepts a complete token.place contract and creates non-live remote mode', () => {
    const options = validateOptions(parseArgs([], valid));
    expect(buildEnv(options, {}).REMOTE_SMOKE_USE_WEBSERVER).toBe('0');
    expect(
      buildEnv({ ...options, baseURL: 'http://127.0.0.1:4173' }, {})
        .REMOTE_SMOKE_USE_WEBSERVER
    ).toBe('1');
  });

  it.each([
    [{ ...valid, DSPACE_EXPECTED_REVISION: 'abc1234' }, /full 40-character/],
    [{ ...valid, DSPACE_EXPECTED_PROVIDER: 'other' }, /token-place or openai/],
    [
      {
        ...valid,
        DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN: 'https://token.place/api',
      },
      /without a path/,
    ],
    [{ ...valid, DSPACE_EXPECTED_TOKEN_PLACE_MODEL: '' }, /origin and model/],
    [
      { ...valid, DSPACE_SMOKE_BASE_URL: 'https://user:secret@example.test' },
      /credential-free/,
    ],
  ])('rejects malformed input without launching Playwright', (env, message) => {
    expect(() => validateOptions(parseArgs([], env))).toThrow(message);
  });

  it('rejects provider-inapplicable and contradictory values', () => {
    expect(() =>
      validateOptions(
        parseArgs([], {
          ...valid,
          DSPACE_EXPECTED_PROVIDER: 'openai',
        })
      )
    ).toThrow(/inapplicable/);
    expect(() =>
      parseArgs(['--expected-version=1.0.0', '--expected-version=2.0.0'], valid)
    ).toThrow(/contradictory/);
  });
});
