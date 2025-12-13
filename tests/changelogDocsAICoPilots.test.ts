import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { getChangelogNotes } from '../frontend/src/utils/changelogNotes';

describe('June 30, 2023 changelog AI companion note', () => {
    it('keeps the historical roadmap language but adds a note for the shipped feature', () => {
        const currentDir = dirname(fileURLToPath(import.meta.url));
        const changelogPath = resolve(
            currentDir,
            '../frontend/src/pages/docs/md/changelog/20230630.md'
        );
        const doc = readFileSync(changelogPath, 'utf8');

        expect(doc).toMatch(/In upcoming versions, I'll be leveraging large language models/i);
        expect(doc).toMatch(/stay tuned/i);

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
