import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('UBI quest donation copy', () => {
    it('frames the donation leaderboard as a future feature', () => {
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

        expect(raw).toMatch(/Once guilds are live/i);
        expect(raw).toMatch(/leaderboard will highlight/i);
    });
});
