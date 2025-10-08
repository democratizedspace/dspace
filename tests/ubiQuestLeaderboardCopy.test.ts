import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('UBI quest donation copy', () => {
    it('describes the donation leaderboard as available today', () => {
        const questPath = join(
            process.cwd(),
            'frontend',
            'src',
            'pages',
            'quests',
            'json',
            'ubi',
            'basicincome.json'
        );

        const raw = readFileSync(questPath, 'utf8');

        expect(raw).toMatch(/leaderboard that gamifies donations/i);
        expect(raw).not.toMatch(/not quite ready/i);
        expect(raw).not.toMatch(/coming soon/i);
    });
});
