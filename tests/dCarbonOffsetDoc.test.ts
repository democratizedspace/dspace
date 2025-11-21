import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getChangelogNotes } from '../frontend/src/utils/changelogNotes';

describe('dCarbon offset documentation', () => {
    it('retains the original roadmap language but cross-links to the modern implementation', () => {
        const changelogPath = join(
            process.cwd(),
            'frontend',
            'src',
            'pages',
            'docs',
            'md',
            'changelog',
            '20221210.md'
        );

        const raw = readFileSync(changelogPath, 'utf8');

        expect(raw).toMatch(/In a future update, you'll be able to burn dCarbon/i);

        const dcarbonDocPath = join(process.cwd(), 'frontend', 'src', 'pages', 'docs', 'md', 'dCarbon.md');
        const dcarbonDoc = readFileSync(dcarbonDocPath, 'utf8');

        expect(dcarbonDoc).toMatch(/burn down accumulated dCarbon/i);
        expect(dcarbonDoc).toMatch(/dCarbon to dOffset[^\n]+process/i);
        expect(dcarbonDoc).toMatch(/dUSD/i);

        const notes = getChangelogNotes('20221210');

        expect(Array.isArray(notes)).toBe(true);
        expect(notes).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    href: '/docs/changelog/20251101',
                    linkLabel: 'November 1, 2025 changelog',
                }),
                expect.objectContaining({
                    href: '/docs/dCarbon',
                    linkLabel: 'dCarbon guide',
                }),
            ])
        );
    });
});
