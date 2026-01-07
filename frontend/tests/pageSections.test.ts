import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Page section structure', () => {
    const pages = [
        'src/pages/index.astro',
        'src/pages/quests/index.astro',
        'src/pages/changelog.astro',
        'src/pages/cloudsync/index.astro',
        'src/pages/leaderboard/index.astro',
    ];

    for (const pagePath of pages) {
        it(`wraps content in page-section list items for ${pagePath}`, () => {
            const content = fs.readFileSync(path.join(__dirname, '..', pagePath), 'utf8');
            expect(content).toMatch(/<li\s+class=\"[^\"]*page-section/);
        });
    }
});
