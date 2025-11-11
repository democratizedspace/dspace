import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

import {
  getChangelogNotes,
  renderChangelogNotes,
} from '../frontend/src/utils/changelogNotes';

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

  it('preserves the original body and relies on notes for contributors guide follow-up', () => {
    const content = readFileSync(changelogPath, 'utf8');
    expect(content).toMatch(/I'll be releasing a contributors guide soon\./i);
    expect(content).not.toMatch(/\[Contributors Guide]\(\/docs\/contributors-guide\)/i);

    const notes = getChangelogNotes('20230630');
    expect(Array.isArray(notes)).toBe(true);
    expect(notes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          href: '/docs/changelog/20251101',
          linkLabel: 'November 1, 2025 changelog',
        }),
        expect.objectContaining({
          href: '/docs/contributors-guide',
          linkLabel: 'Contributors Guide',
        }),
      ])
    );

    const rendered = renderChangelogNotes('20230630');
    expect(rendered).toContain('<a href="/docs/contributors-guide">Contributors Guide</a>');
  });
});
