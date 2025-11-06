import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getChangelogNotes } from '../frontend/src/utils/changelogNotes';

const changelogPath = join(
    process.cwd(),
    'frontend',
    'src',
    'pages',
    'docs',
    'md',
    'changelog',
    '20230101.md'
);

describe('January 1, 2023 changelog', () => {
    it('keeps the historical warning but points readers to the modern behavior via a note', () => {
        const doc = readFileSync(changelogPath, 'utf8');
        expect(doc).toMatch(/it won't reserve the materials/i);

        const notes = getChangelogNotes('20230101');

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
