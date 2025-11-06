import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

import { getChangelogNotes } from '../frontend/src/utils/changelogNotes';

describe('changelog 20230630 contributors guidance', () => {
  const changelogPath = join(
    process.cwd(),
    'frontend',
    'src',
    'pages',
    'docs',
    'md',
    'changelog',
    '20230630.md'
  );

  it('keeps the original contributor roadmap text but points to the follow-up changelog', () => {
    const content = readFileSync(changelogPath, 'utf8');
    expect(content).toMatch(/I'\ll be releasing a contributors guide soon\./i);

    const notes = getChangelogNotes('20230630');
    expect(Array.isArray(notes)).toBe(true);
    expect(notes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          href: '/docs/changelog/20251101',
          linkLabel: 'November 1, 2025 changelog',
        }),
      ])
    );
  });
});
