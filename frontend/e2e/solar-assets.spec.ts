import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

for (const step of [1, 2, 3, 4, 5]) {
    test(`serves solar step ${step} from the production build`, async ({ request }) => {
        const response = await request.get(`/assets/quests/solar/step${step}.svg`);
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toMatch(/^image\/svg\+xml(?:;|$)/);
        const source = readFileSync(
            new URL(`../public/assets/quests/solar/step${step}.svg`, import.meta.url)
        );
        const built = readFileSync(
            new URL(`../dist/client/assets/quests/solar/step${step}.svg`, import.meta.url)
        );
        expect(built.equals(source)).toBe(true);
        expect((await response.body()).equals(source)).toBe(true);
    });
}
