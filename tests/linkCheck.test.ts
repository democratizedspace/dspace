import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const runLinkCheck = () =>
  execFileSync('node', ['scripts/link-check.mjs'], {
    encoding: 'utf8',
    stdio: 'pipe',
  });

const staleBranchLinkPattern =
  /https?:\/\/(?:github\.com\/democratizedspace\/dspace\/blob\/v3(?:\/|$)|github\.com\/democratizedspace\/dspace\/tree\/v3(?:\/|$)|raw\.githubusercontent\.com\/democratizedspace\/dspace\/v3\/)/;

const scopedDirs = ['AGENTS.md', 'docs', 'frontend', '.github'];
const excludedFiles = new Set(['tests/linkCheck.test.ts']);

function findStaleBranchUrlsWithFallback() {
  const rgResult = spawnSync(
    'rg',
    [
      '--hidden',
      '-n',
      'https?://github\\.com/democratizedspace/dspace/(blob|tree)/v3(?:/|$)|https?://raw\\.githubusercontent\\.com/democratizedspace/dspace/v3/',
      ...scopedDirs,
    ],
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
      .filter((line) => {
        const file = line.split(':', 1)[0];
        return !excludedFiles.has(file);
      });
  }

  const files = execFileSync('git', ['ls-files', ...scopedDirs], {
    encoding: 'utf8',
  })
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean)
    .filter((file) => !excludedFiles.has(file));

  const offenders = [];
  for (const file of files) {
    const absolutePath = path.resolve(process.cwd(), file);
    let contents = '';
    try {
      contents = readFileSync(absolutePath, 'utf8');
    } catch {
      continue;
    }

    if (staleBranchLinkPattern.test(contents)) {
      offenders.push(file);
    }
  }

  return offenders;
}

describe('markdown link validation', () => {
  it('resolves internal and GitHub links without 404s', () => {
    expect(() => runLinkCheck()).not.toThrow();
  });

  it('rejects stale v3 branch URLs and allows main branch plus named v3 references', () => {
    expect(
      staleBranchLinkPattern.test(
        'https://github.com/democratizedspace/dspace/blob/v3/docs/prompts/codex/quests.md'
      )
    ).toBe(true);
    expect(
      staleBranchLinkPattern.test(
        'https://github.com/democratizedspace/dspace/tree/v3/frontend/src/pages'
      )
    ).toBe(true);
    expect(
      staleBranchLinkPattern.test(
        'https://raw.githubusercontent.com/democratizedspace/dspace/v3/frontend/.vscode/extensions.json'
      )
    ).toBe(true);

    expect(
      staleBranchLinkPattern.test(
        'https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/quests.md'
      )
    ).toBe(false);
    expect(staleBranchLinkPattern.test('docs/qa/v3.md')).toBe(false);
    expect(staleBranchLinkPattern.test('v3.0.0-rc.4')).toBe(false);
  });

  it('has no stale v3 branch URLs to democratizedspace/dspace in tracked files', () => {
    const offenders = findStaleBranchUrlsWithFallback();
    expect(
      offenders,
      `Found stale v3 URLs in:\n${offenders.join('\n')}`
    ).toEqual([]);
  });
});