import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
let runTestGroup: any;
let TEST_GROUPS: any;

import path from 'path';
import { pathToFileURL } from 'url';

const execSyncMock = vi.fn();
const existsSyncMock = vi.fn(() => true);
const frontendRoot = path.resolve(__dirname, '../frontend');

vi.mock('child_process', () => ({
  execSync: execSyncMock,
  default: { execSync: execSyncMock },
}));
// Provide both named and default exports so ESM consumers can access fs mocks consistently
vi.mock('fs', () => ({
  existsSync: existsSyncMock,
  default: { existsSync: existsSyncMock },
}));

beforeAll(async () => {
  const fileUrl = pathToFileURL(
    path.resolve(__dirname, '../frontend/scripts/run-test-groups.mjs')
  );
  const mod = await import(fileUrl.toString());
  runTestGroup = mod.runTestGroup;
  TEST_GROUPS = mod.TEST_GROUPS;
});

afterEach(() => {
  execSyncMock.mockReset();
  existsSyncMock.mockClear();
});

// Basic sanity check that TEST_GROUPS is populated
describe('run-test-groups', () => {
  it('exposes test groups', () => {
    expect(Array.isArray(TEST_GROUPS)).toBe(true);
    expect(TEST_GROUPS.length).toBeGreaterThan(0);
  });

  it('returns true when exec succeeds', () => {
    execSyncMock.mockImplementation(() => ({}) as any);
    const result = runTestGroup({
      name: 'Demo',
      files: ['demo.spec.ts'],
      parallel: false,
    });
    expect(execSyncMock).toHaveBeenCalledWith(
      expect.stringContaining('demo.spec.ts --workers=1 --reporter=dot'),
      expect.objectContaining({ cwd: frontendRoot })
    );
    expect(result).toBe(true);
  });

  it('returns false when exec fails', () => {
    execSyncMock.mockImplementation(() => {
      throw new Error('fail');
    });
    const result = runTestGroup({
      name: 'Fail',
      files: ['fail.spec.ts'],
      parallel: true,
      workers: 2,
    });
    expect(execSyncMock).toHaveBeenCalledWith(
      expect.stringContaining('fail.spec.ts --workers=2 --reporter=dot'),
      expect.objectContaining({ cwd: frontendRoot })
    );
    expect(result).toBe(false);
  });

  it('applies grep patterns when provided', () => {
    execSyncMock.mockImplementation(() => ({}) as any);
    runTestGroup({
      name: 'Grep',
      files: ['alpha.spec.ts'],
      parallel: true,
      workers: 3,
      grep: 'foo|bar',
    });
    expect(execSyncMock).toHaveBeenCalledWith(
      expect.stringContaining(
        'alpha.spec.ts -g "foo|bar" --workers=3 --reporter=dot'
      ),
      expect.objectContaining({ cwd: frontendRoot })
    );
  });
});
