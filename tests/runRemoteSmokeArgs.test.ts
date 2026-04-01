import { describe, expect, test } from 'vitest';

import { buildHarnessEnv, parseArgs } from '../scripts/run-remote-smoke.mjs';

describe('run-remote-smoke arg parsing', () => {
  test('enables mutation by default', () => {
    const parsed = parseArgs(['--baseURL=https://example.com']);
    expect(parsed.mutate).toBe(true);
  });

  test('supports explicit non-mutating mode with --no-mutate', () => {
    const parsed = parseArgs(['--baseURL=https://example.com', '--no-mutate']);
    expect(parsed.mutate).toBe(false);
  });

  test('supports --safe alias for non-mutating mode', () => {
    const parsed = parseArgs(['--baseURL=https://example.com', '--safe']);
    expect(parsed.mutate).toBe(false);
  });

  test('maps mutation flag into harness environment', () => {
    const envEnabled = buildHarnessEnv(
      {
        baseURL: 'https://example.com',
        chatMode: 'ui',
        chatLiveBackend: 'mock',
        mutate: true,
      },
      {}
    );

    const envDisabled = buildHarnessEnv(
      {
        baseURL: 'https://example.com',
        chatMode: 'ui',
        chatLiveBackend: 'mock',
        mutate: false,
      },
      {}
    );

    expect(envEnabled.REMOTE_SMOKE_MUTATION).toBe('1');
    expect(envDisabled.REMOTE_SMOKE_MUTATION).toBe('0');
  });
});
