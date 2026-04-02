import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const runLinkCheck = () =>
  execFileSync('node', ['scripts/link-check.mjs'], {
    encoding: 'utf8',
    stdio: 'pipe',
  });

const staleBranchPatterns = [
  'https://github.com/democratizedspace/dspace/blob/v3/',
  'http://github.com/democratizedspace/dspace/blob/v3/',
];

const scopedDirs = ['frontend/tests', 'tests', 'scripts/tests'];
const excludedFiles = new Set(['tests/linkCheck.test.ts']);

function findStaleBranchUrlsWithFallback() {
  const rgPatterns = staleBranchPatterns.flatMap((pattern) => ['-e', pattern]);
  const rgResult = spawnSync(
    'rg',
    ['-n', ...rgPatterns, ...scopedDirs, '-g', '!tests/linkCheck.test.ts'],
    {
      encoding: 'utf8',
    }
  );

  if (!rgResult.error) {
    if (rgResult.status === 1) {
      return [];
    }

    if (rgResult.status !== 0) {
      throw new Error(
        `rg failed with status ${rgResult.status}: ${rgResult.stderr}`
      );
    }

    return rgResult.stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((file) => !excludedFiles.has(file));
  }

  const files = execFileSync('git', ['ls-files', ...scopedDirs], {
    encoding: 'utf8',
  })
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean);

  const offenders = [];
  for (const file of files) {
    const absolutePath = path.resolve(process.cwd(), file);
    let contents = '';
    try {
      contents = readFileSync(absolutePath, 'utf8');
    } catch {
      continue;
    }

    if (staleBranchPatterns.some((pattern) => contents.includes(pattern))) {
      offenders.push(file);
    }
  }

  return offenders;
}

describe('markdown link validation', () => {
  it('resolves internal and GitHub links without 404s', () => {
    expect(() => runLinkCheck()).not.toThrow();
  });

  it('has no stale v3 branch URLs to democratizedspace/dspace in tracked files', () => {
    const offenders = findStaleBranchUrlsWithFallback();
    expect(
      offenders,
      `Found stale v3 URLs in:\n${offenders.join('\n')}`
    ).toEqual([]);
  });
});
