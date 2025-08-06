import { describe, it, expect } from 'vitest';

describe('pnpmfile.cjs', () => {
  it('pre-approves native builds', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pnpmfile = require('../pnpmfile.cjs');
    expect(pnpmfile?.config?.allowedBuiltDependencies).toEqual([
      'canvas',
      'esbuild',
      '@swc/core'
    ]);
  });
});
