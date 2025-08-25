import { expect, test, vi } from 'vitest';

const execSync = vi.fn();
vi.mock('child_process', () => ({ execSync }));

test('checkPatchCoverage uses origin HEAD branch', () => {
  execSync.mockImplementation(cmd => {
    if (cmd === 'git remote show origin') {
      return Buffer.from('HEAD branch: v3\n');
    }
    if (cmd.startsWith('git merge-base')) {
      expect(cmd.includes('origin/v3')).toBe(true);
      return Buffer.from('');
    }
    if (cmd.startsWith('git diff --name-only')) {
      return Buffer.from('');
    }
    return Buffer.from('');
  });
  delete require.cache[require.resolve('../checkPatchCoverage.cjs')];
  require('../checkPatchCoverage.cjs');
});

test('checkPatchCoverage handles missing origin remote', () => {
  execSync.mockReset();
  execSync.mockImplementation(cmd => {
    if (cmd === 'git remote show origin' || cmd === 'git remote get-url origin') {
      throw new Error('no origin');
    }
    if (cmd.startsWith('git merge-base v3') || cmd.startsWith('git diff --name-only')) {
      return Buffer.from('');
    }
    if (cmd === 'git symbolic-ref --short HEAD') {
      return Buffer.from('work\n');
    }
    return Buffer.from('');
  });
  delete require.cache[require.resolve('../checkPatchCoverage.cjs')];
  const { getDefaultBranch, getChangedFiles } = require('../checkPatchCoverage.cjs');
  expect(() => {
    getDefaultBranch();
    getChangedFiles();
  }).not.toThrow();
});
