import pnpmfile from '../pnpmfile.cjs';
import { describe, it, expect } from 'vitest';

describe('pnpmfile', () => {
  it('pre-approves native build dependencies', () => {
    const context = { resolutionBuilds: new Set<string>() };
    const lockfile = {};
    pnpmfile.hooks.afterAllResolved(lockfile, context as any);
    expect([...context.resolutionBuilds]).toEqual(['canvas', 'esbuild', '@swc/core']);
  });
});
