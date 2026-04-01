import { describe, expect, it } from 'vitest';
import { parseArgs } from '../run-remote-smoke.mjs';

describe('run-remote-smoke parseArgs', () => {
  it('enables mutation by default for launch-critical custom-item checks', () => {
    const parsed = parseArgs(['--baseURL=https://democratized.space']);

    expect(parsed.mutate).toBe(true);
    expect(parsed.baseURL).toBe('https://democratized.space');
  });

  it('supports explicit non-mutating opt-out flags', () => {
    const noMutate = parseArgs(['--baseURL=https://democratized.space', '--no-mutate']);
    const safeAlias = parseArgs(['--baseURL=https://democratized.space', '--safe']);

    expect(noMutate.mutate).toBe(false);
    expect(safeAlias.mutate).toBe(false);
  });

  it('keeps --mutate available and allows it to override --no-mutate when last', () => {
    const reEnabled = parseArgs([
      '--baseURL=https://democratized.space',
      '--no-mutate',
      '--mutate',
    ]);

    expect(reEnabled.mutate).toBe(true);
  });
});
