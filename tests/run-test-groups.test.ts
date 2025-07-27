import { describe, it, expect, vi } from 'vitest';
import * as child from 'child_process';
import { runTestGroup, TEST_GROUPS } from '../frontend/scripts/run-test-groups.mjs';

// Basic sanity check that TEST_GROUPS is populated
describe('run-test-groups', () => {
  it('exposes test groups', () => {
    expect(Array.isArray(TEST_GROUPS)).toBe(true);
    expect(TEST_GROUPS.length).toBeGreaterThan(0);
  });

  it('returns true when exec succeeds', () => {
    const spy = vi.spyOn(child, 'execSync').mockImplementation(() => {} as any);
    const result = runTestGroup({ name: 'Demo', files: ['demo.spec.ts'], parallel: false });
    expect(spy).toHaveBeenCalled();
    expect(result).toBe(true);
    spy.mockRestore();
  });

  it('returns false when exec fails', () => {
    const spy = vi.spyOn(child, 'execSync').mockImplementation(() => {
      throw new Error('fail');
    });
    const result = runTestGroup({ name: 'Fail', files: ['fail.spec.ts'], parallel: true, workers: 2 });
    expect(spy).toHaveBeenCalled();
    expect(result).toBe(false);
    spy.mockRestore();
  });
});
