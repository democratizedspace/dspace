import { describe, expect, it } from 'vitest';
import {
  buildEnv,
  parseArgs,
  validateOptions,
} from '../run-remote-chat-smoke.mjs';

const valid = {
  DSPACE_SMOKE_BASE_URL: 'https://example.test',
  DSPACE_EXPECTED_VERSION: '3.1.0',
  DSPACE_EXPECTED_REVISION: 'a'.repeat(40),
  DSPACE_EXPECTED_PROVIDER: 'token-place',
  DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN: 'https://token.place',
  DSPACE_EXPECTED_TOKEN_PLACE_MODEL: 'llama-3.1-8b-instruct',
};

describe('remote chat smoke runner', () => {
  it('accepts complete environment input and disables the local web server remotely', () => {
    const options = validateOptions(parseArgs([], valid));
    expect(buildEnv(options, {}).REMOTE_SMOKE_USE_WEBSERVER).toBe('0');
  });

  it('lets flags override environment values', () => {
    expect(parseArgs(['--expected-version=4.0.0'], valid).version).toBe(
      '4.0.0'
    );
  });

  it.each([
    [{ ...valid, DSPACE_EXPECTED_REVISION: 'abcdef0' }, /full 40-character/],
    [{ ...valid, DSPACE_EXPECTED_PROVIDER: 'other' }, /token-place or openai/],
    [
      {
        ...valid,
        DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN: 'https://token.place/api',
      },
      /HTTPS origin/,
    ],
    [
      { ...valid, DSPACE_EXPECTED_TOKEN_PLACE_MODEL: '' },
      /origin and model are required/,
    ],
    [
      { ...valid, DSPACE_EXPECTED_PROVIDER: 'openai' },
      /inapplicable when provider is openai/,
    ],
  ])('rejects malformed or contradictory input', (env, diagnostic) => {
    expect(() => validateOptions(parseArgs([], env))).toThrow(diagnostic);
  });

  it('rejects missing expectations before launch without exposing values', () => {
    expect(() => validateOptions(parseArgs([], {}))).toThrow(
      /missing required expectation/
    );
  });

  it('rejects unknown flags instead of ambiguously forwarding them', () => {
    expect(() => parseArgs(['--expected-revison=abc'], valid)).toThrow(
      /unknown argument/
    );
  });
});
