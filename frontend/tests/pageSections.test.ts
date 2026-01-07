import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Page section structure', () => {
    const pages = [
        'src/pages/index.astro',
        'src/pages/quests/index.astro',
        'src/pages/inventory/index.astro',
        'src/pages/energy/index.astro',
        'src/pages/profile/index.astro',
        'src/pages/docs/index.astro',
        'src/pages/chat/index.astro',
        'src/pages/changelog.astro',
        'src/pages/gamesaves/index.astro',
        'src/pages/cloudsync/index.astro',
        'src/pages/contentbackup/index.astro',
        'src/pages/achievements/index.astro',
        'src/pages/stats.astro',
        'src/pages/leaderboard/index.astro',
        'src/pages/titles/index.astro',
        'src/pages/toolbox.astro',
        'src/pages/settings.astro',
    ];

    for (const pagePath of pages) {
        it(`wraps content in page-section list items for ${pagePath}`, () => {
            const content = fs.readFileSync(path.join(__dirname, '..', pagePath), 'utf8');
            expect(content).toMatch(/<li\s+class=\"[^\"]*page-section/);
        });
    }
});
