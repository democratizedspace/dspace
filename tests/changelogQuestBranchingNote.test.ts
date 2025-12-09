import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getChangelogNotes, renderChangelogNotes } from '../frontend/src/utils/changelogNotes';

describe('changelog 20230630 branching quest promise', () => {
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

    it('documents the follow-up for branching questlines', () => {
        const content = readFileSync(changelogPath, 'utf8');

        expect(content).toMatch(/dialogues are linear for now/i);

        const notes = getChangelogNotes('20230630');

        expect(Array.isArray(notes)).toBe(true);
        expect(notes).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    href: '/docs/changelog/20251101',
                    linkLabel: 'November 1, 2025 changelog',
                }),
                expect.objectContaining({
                    href: '/docs/quest-trees',
                    linkLabel: 'Quest trees',
                }),
            ])
        );

        const rendered = renderChangelogNotes('20230630');
        expect(rendered).toContain('<a href="/docs/quest-trees">Quest trees</a>');
    });
});
