import { describe, it, expect, vi } from 'vitest';
import { execSync } from 'child_process';
let runTestGroup: any;
let TEST_GROUPS: any;

import path from 'path';
import { pathToFileURL } from 'url';

beforeAll(async () => {
  const fileUrl = pathToFileURL(path.resolve(__dirname, '../frontend/scripts/run-test-groups.mjs'));
  const mod = await import(fileUrl.toString());
  runTestGroup = mod.runTestGroup;
  TEST_GROUPS = mod.TEST_GROUPS;
});

vi.mock('child_process', () => ({ execSync: vi.fn() }));

// Basic sanity check that TEST_GROUPS is populated
describe.skip('run-test-groups', () => {
  it('exposes test groups', () => {
    expect(Array.isArray(TEST_GROUPS)).toBe(true);
    expect(TEST_GROUPS.length).toBeGreaterThan(0);
  });

  it('returns true when exec succeeds', () => {
    const spy = vi.mocked(execSync);
    spy.mockImplementation(() => ({} as any));
    const result = runTestGroup({ name: 'Demo', files: ['demo.spec.ts'], parallel: false });
    expect(spy).toHaveBeenCalled();
    expect(result).toBe(true);
    spy.mockRestore();
  });

  it('returns false when exec fails', () => {
    const spy = vi.mocked(execSync);
    spy.mockImplementation(() => {
      throw new Error('fail');
    });
    const result = runTestGroup({ name: 'Fail', files: ['fail.spec.ts'], parallel: true, workers: 2 });
    expect(spy).toHaveBeenCalled();
    expect(result).toBe(false);
    spy.mockRestore();
  });
});
