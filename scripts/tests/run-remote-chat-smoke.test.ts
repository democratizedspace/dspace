import { describe, expect, it } from 'vitest';
import {
  buildEnv,
  parseArgs,
  validateOptions,
} from '../run-remote-chat-smoke.mjs';

const valid = {
  baseURL: 'https://staging.example.test',
  version: '3.1.0',
  revision: '0123456789abcdef0123456789abcdef01234567',
  provider: 'token-place',
  tokenPlaceOrigin: 'https://token.place',
  tokenPlaceModel: 'llama-3.1-8b-instruct',
};

describe('remote chat smoke arguments', () => {
  it('lets flags deterministically override environment values', () => {
    const parsed = parseArgs(
      ['--expected-version=3.1.0', '--base-url', valid.baseURL],
      {
        DSPACE_EXPECTED_VERSION: '9.9.9',
        DSPACE_SMOKE_BASE_URL: 'https://wrong.test',
      }
    );
    expect(parsed.version).toBe('3.1.0');
    expect(parsed.baseURL).toBe(valid.baseURL);
  });

  it.each([
    [{ ...valid, revision: '0123456' }, /full lowercase 40-character/],
    [{ ...valid, provider: 'other' }, /token-place or openai/],
    [
      { ...valid, tokenPlaceOrigin: undefined },
      /requires expected origin and model/,
    ],
    [{ ...valid, provider: 'openai' }, /inapplicable/],
    [{ ...valid, baseURL: 'production' }, /absolute HTTP/],
  ])(
    'rejects malformed, contradictory, or incomplete input',
    (input, message) => {
      expect(() => validateOptions(input)).toThrow(message);
    }
  );

  it('accepts OpenAI only without token.place expectations', () => {
    expect(
      validateOptions({
        ...valid,
        provider: 'openai',
        tokenPlaceOrigin: undefined,
        tokenPlaceModel: undefined,
      })
    ).toBeTruthy();
  });

  it('builds isolated remote-mode environment without secret values', () => {
    const env = buildEnv(valid, {});
    expect(env.REMOTE_CHAT_SMOKE).toBe('1');
    expect(JSON.stringify(env)).not.toMatch(/authorization|api.?key|sk-/i);
  });
});
