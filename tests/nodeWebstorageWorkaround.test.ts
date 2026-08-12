import { describe, expect, it } from 'vitest';

const {
  addWebStorageWorkaroundToEnv,
  supportsWebStorageFlag,
  WEBSTORAGE_FLAG,
} = require('../scripts/node-webstorage-workaround.cjs');

describe('node webstorage workaround', () => {
  it('reports flag support based on the running binary allowed-flags set', () => {
    expect(supportsWebStorageFlag(new Set([WEBSTORAGE_FLAG]))).toBe(true);
    expect(supportsWebStorageFlag(new Set())).toBe(false);
  });

  it('leaves NODE_OPTIONS untouched when the flag is unsupported (e.g. Node 20 or Node <22.4)', () => {
    const env = addWebStorageWorkaroundToEnv(
      { NODE_OPTIONS: '--trace-warnings' },
      new Set()
    );

    expect(env.NODE_OPTIONS).toBe('--trace-warnings');
    expect(env.NODE_OPTIONS).not.toContain(WEBSTORAGE_FLAG);
  });

  it('adds the workaround flag when supported, without dropping existing NODE_OPTIONS', () => {
    const env = addWebStorageWorkaroundToEnv(
      { NODE_OPTIONS: '--trace-warnings' },
      new Set([WEBSTORAGE_FLAG])
    );

    expect(env.NODE_OPTIONS).toContain('--trace-warnings');
    expect(env.NODE_OPTIONS).toContain(WEBSTORAGE_FLAG);
  });

  it('does not duplicate the flag if it is already present', () => {
    const env = addWebStorageWorkaroundToEnv(
      { NODE_OPTIONS: WEBSTORAGE_FLAG },
      new Set([WEBSTORAGE_FLAG])
    );

    expect(
      env.NODE_OPTIONS.split(/\s+/).filter((o: string) => o === WEBSTORAGE_FLAG)
    ).toHaveLength(1);
  });

  it('adds the flag when NODE_OPTIONS is unset', () => {
    const env = addWebStorageWorkaroundToEnv({}, new Set([WEBSTORAGE_FLAG]));

    expect(env.NODE_OPTIONS).toBe(WEBSTORAGE_FLAG);
  });
});
