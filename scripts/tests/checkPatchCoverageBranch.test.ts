import { expect, test, vi } from 'vitest';

vi.mock('child_process', () => {
  return {
    execSync: vi.fn((cmd: string) => {
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
    })
  };
});

test('checkPatchCoverage uses origin HEAD branch', () => {
  require('../checkPatchCoverage.cjs');
});
