import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getChangelogNotes } from '../frontend/src/utils/changelogNotes';

describe('October 31, 2022 changelog', () => {
    it('records the follow-up via a historical note instead of rewriting the body', () => {
        const changelogPath = join(
            process.cwd(),
            'frontend',
            'src',
            'pages',
            'docs',
            'md',
            'changelog',
            '20221031.md'
        );

        const content = readFileSync(changelogPath, 'utf8');

        expect(content).toMatch(/Plenty more documentation coming in the future/i);
        expect(content).toMatch(/Next up: a big content update/i);

        const notes = getChangelogNotes('20221031');

        expect(Array.isArray(notes)).toBe(true);
        expect(notes).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    href: '/docs/changelog/20230630',
                    linkLabel: 'June 30, 2023 changelog',
                }),
            ])
        );
    });
});
