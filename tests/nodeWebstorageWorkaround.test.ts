import { describe, expect, it } from 'vitest';

const {
  addWebStorageWorkaroundToEnv,
  nodeMajorVersion,
  WORKSTORAGE_FLAG,
} = require('../scripts/node-webstorage-workaround.cjs');

describe('node webstorage workaround', () => {
  it('parses the major version out of a Node version string', () => {
    expect(nodeMajorVersion('20.20.2')).toBe(20);
    expect(nodeMajorVersion('22.0.0')).toBe(22);
    expect(nodeMajorVersion('26.5.1')).toBe(26);
  });

  it('leaves NODE_OPTIONS untouched on Node 20, where the flag is fatal', () => {
    const env = addWebStorageWorkaroundToEnv(
      { NODE_OPTIONS: '--trace-warnings' },
      '20.20.2'
    );

    expect(env.NODE_OPTIONS).toBe('--trace-warnings');
    expect(env.NODE_OPTIONS).not.toContain(WORKSTORAGE_FLAG);
  });

  it('adds the workaround flag on Node 22+ without dropping existing NODE_OPTIONS', () => {
    const env = addWebStorageWorkaroundToEnv(
      { NODE_OPTIONS: '--trace-warnings' },
      '22.0.0'
    );

    expect(env.NODE_OPTIONS).toContain('--trace-warnings');
    expect(env.NODE_OPTIONS).toContain(WORKSTORAGE_FLAG);
  });

  it('does not duplicate the flag if it is already present', () => {
    const env = addWebStorageWorkaroundToEnv(
      { NODE_OPTIONS: WORKSTORAGE_FLAG },
      '26.5.1'
    );

    expect(
      env.NODE_OPTIONS.split(/\s+/).filter((o) => o === WORKSTORAGE_FLAG)
    ).toHaveLength(1);
  });

  it('adds the flag when NODE_OPTIONS is unset', () => {
    const env = addWebStorageWorkaroundToEnv({}, '24.1.0');

    expect(env.NODE_OPTIONS).toBe(WORKSTORAGE_FLAG);
  });
});
