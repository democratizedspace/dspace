import { afterEach, expect, test, vi } from 'vitest';

const execFileSync = vi.fn();
vi.mock('child_process', () => ({ execFileSync }));

afterEach(() => {
  delete process.env.GITHUB_BASE_REF;
  delete process.env.PATCH_COVERAGE_BASE;
  execFileSync.mockReset();
});

test('checkPatchCoverage uses origin HEAD branch', () => {
  execFileSync.mockImplementation((cmd, args) => {
    if (cmd === 'git' && args[0] === 'remote' && args[1] === 'show' && args[2] === 'origin') {
      return Buffer.from('HEAD branch: v3\n');
    }
    if (cmd === 'git' && args[0] === 'merge-base') {
      expect(args.includes('origin/v3')).toBe(true);
      return Buffer.from('');
    }
    if (cmd === 'git' && args[0] === 'diff') {
      return Buffer.from('');
    }
    throw new Error(`unexpected command: ${cmd} ${args?.join(' ')}`);
  });
  delete require.cache[require.resolve('../checkPatchCoverage.cjs')];
  require('../checkPatchCoverage.cjs');
});

test('checkPatchCoverage uses env var base branch when provided', () => {
  process.env.GITHUB_BASE_REF = 'v3';
  execFileSync.mockImplementation((cmd, args) => {
    if (cmd === 'git' && args[0] === 'remote' && args[1] === 'get-url' && args[2] === 'origin') {
      return Buffer.from('');
    }
    if (cmd === 'git' && args[0] === 'merge-base') {
      expect(args.includes('origin/v3')).toBe(true);
      return Buffer.from('base');
    }
    if (cmd === 'git' && args[0] === 'diff') {
      return Buffer.from('');
    }
    throw new Error(`unexpected command: ${cmd} ${args?.join(' ')}`);
  });
  delete require.cache[require.resolve('../checkPatchCoverage.cjs')];
  const { getDefaultBranch, getChangedFiles } = require('../checkPatchCoverage.cjs');
  expect(getDefaultBranch()).toBe('v3');
  expect(() => getChangedFiles()).not.toThrow();
});

test('checkPatchCoverage prioritizes PATCH_COVERAGE_BASE over GITHUB_BASE_REF', () => {
  process.env.GITHUB_BASE_REF = 'v3';
  process.env.PATCH_COVERAGE_BASE = 'release/v4';
  execFileSync.mockImplementation((cmd, args) => {
    if (cmd === 'git' && args[0] === 'remote' && args[1] === 'get-url' && args[2] === 'origin') {
      return Buffer.from('');
    }
    if (cmd === 'git' && args[0] === 'merge-base') {
      expect(args.includes('origin/release/v4')).toBe(true);
      return Buffer.from('base');
    }
    if (cmd === 'git' && args[0] === 'diff') {
      return Buffer.from('');
    }
    throw new Error(`unexpected command: ${cmd} ${args?.join(' ')}`);
  });
  delete require.cache[require.resolve('../checkPatchCoverage.cjs')];
  const { getDefaultBranch, getChangedFiles } = require('../checkPatchCoverage.cjs');
  expect(getDefaultBranch()).toBe('release/v4');
  expect(() => getChangedFiles()).not.toThrow();
});

test('checkPatchCoverage trims whitespace from env var', () => {
  process.env.PATCH_COVERAGE_BASE = '  release/v4  ';
  execFileSync.mockImplementation((cmd, args) => {
    if (cmd === 'git' && args[0] === 'remote' && args[1] === 'get-url' && args[2] === 'origin') {
      return Buffer.from('');
    }
    if (cmd === 'git' && args[0] === 'merge-base') {
      expect(args.includes('origin/release/v4')).toBe(true);
      return Buffer.from('base');
    }
    if (cmd === 'git' && args[0] === 'diff') {
      return Buffer.from('');
    }
    throw new Error(`unexpected command: ${cmd} ${args?.join(' ')}`);
  });
  delete require.cache[require.resolve('../checkPatchCoverage.cjs')];
  const { getDefaultBranch, getChangedFiles } = require('../checkPatchCoverage.cjs');
  expect(getDefaultBranch()).toBe('release/v4');
  expect(() => getChangedFiles()).not.toThrow();
});

test('checkPatchCoverage handles missing origin remote', () => {
  execFileSync.mockImplementation((cmd, args) => {
    if (cmd === 'git' && args[0] === 'remote' && args[1] === 'show' && args[2] === 'origin') {
      throw new Error('no origin');
    }
    if (cmd === 'git' && args[0] === 'remote' && args[1] === 'get-url' && args[2] === 'origin') {
      throw new Error('no origin');
    }
    if (cmd === 'git' && args[0] === 'symbolic-ref') {
      return Buffer.from('work\n');
    }
    if (cmd === 'git' && args[0] === 'merge-base') {
      expect(args.includes('work')).toBe(true);
      return Buffer.from('');
    }
    if (cmd === 'git' && args[0] === 'diff') {
      return Buffer.from('');
    }
    throw new Error(`unexpected command: ${cmd} ${args?.join(' ')}`);
  });
  delete require.cache[require.resolve('../checkPatchCoverage.cjs')];
  const { getDefaultBranch, getChangedFiles } = require('../checkPatchCoverage.cjs');
  expect(() => {
    getDefaultBranch();
    getChangedFiles();
  }).not.toThrow();
});
