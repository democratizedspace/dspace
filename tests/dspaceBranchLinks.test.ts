import fs from 'node:fs';
import { globSync } from 'glob';
import { describe, expect, it } from 'vitest';

const staleDspaceBranchUrlPattern =
  /https?:\/\/github\.com\/democratizedspace\/dspace\/(?:blob|tree)\/v3(?:[/?#]|$)|https?:\/\/raw\.githubusercontent\.com\/democratizedspace\/dspace\/v3(?:\/|$)/i;

describe('dspace self-link branch references', () => {
  it('flags stale v3 branch URLs and allows valid named v3 references', () => {
    expect(
      staleDspaceBranchUrlPattern.test(
        'https://github.com/democratizedspace/dspace/blob/v3/docs/README.md'
      )
    ).toBe(true);
    expect(
      staleDspaceBranchUrlPattern.test('https://github.com/democratizedspace/dspace/tree/v3')
    ).toBe(true);
    expect(
      staleDspaceBranchUrlPattern.test(
        'https://raw.githubusercontent.com/democratizedspace/dspace/v3/frontend/.vscode/extensions.json'
      )
    ).toBe(true);

    expect(
      staleDspaceBranchUrlPattern.test(
        'https://github.com/democratizedspace/dspace/blob/main/docs/README.md'
      )
    ).toBe(false);
    expect(staleDspaceBranchUrlPattern.test('docs/qa/v3.md')).toBe(false);
    expect(staleDspaceBranchUrlPattern.test('v3.0.0-rc.4')).toBe(false);
  });

  it('has no stale v3 branch URLs for dspace self-links anywhere in tracked text files', () => {
    const candidates = globSync('**/*.{md,mdx,txt,json,yml,yaml,mjs,cjs,js,ts,tsx}', {
      ignore: [
        '**/.git/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        '**/test-artifacts/**',
        '**/.pnpm/**',
        'tests/dspaceBranchLinks.test.ts',
      ],
    });

    const staleHits: string[] = [];
    for (const file of candidates) {
      const content = fs.readFileSync(file, 'utf8');
      if (staleDspaceBranchUrlPattern.test(content)) {
        staleHits.push(file);
      }
    }

    expect(staleHits).toEqual([]);
  });
});
