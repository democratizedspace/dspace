import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getChangelogNotes } from '../frontend/src/utils/changelogNotes';

describe('October 19, 2022 changelog', () => {
    it('keeps the original promise but adds a note about the shipped requirements', () => {
        const changelogPath = join(
            process.cwd(),
            'frontend',
            'src',
            'pages',
            'docs',
            'md',
            'changelog',
            '20221019.md'
        );

        const doc = readFileSync(changelogPath, 'utf8');

        expect(doc).toMatch(/Material and machine requirements don't apply yet/i);

        const notes = getChangelogNotes('20221019');

        expect(Array.isArray(notes)).toBe(true);
        expect(notes).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    href: '/docs/processes',
                    linkLabel: 'Process guide',
                }),
            ])
        );
    });
});
