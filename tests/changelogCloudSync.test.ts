import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getChangelogNotes } from '../frontend/src/utils/changelogNotes';

describe('September 15, 2023 changelog', () => {
    it('records Cloud Sync as a historical note while preserving the original copy', () => {
        const changelogPath = join(
            process.cwd(),
            'frontend',
            'src',
            'pages',
            'docs',
            'md',
            'changelog',
            '20230915.md'
        );

        const content = readFileSync(changelogPath, 'utf8');

        expect(content).toMatch(/will eventually have cloud saves/i);

        const notes = getChangelogNotes('20230915');

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
