import { test } from '@playwright/test';

import {
    clearUserData,
    expectLocalStorageCleared,
    expectLocalStorageValue,
    waitForHydration,
} from './test-helpers';

test.describe('Local storage helpers', () => {
    test('polls until expected localStorage values settle', async ({ page }) => {
        await clearUserData(page);

        await page.goto('/');
        await waitForHydration(page);

        await page.evaluate(() => {
            localStorage.setItem('helper-string', 'ready');
            localStorage.setItem('helper-regex', 'pattern-123');
            localStorage.removeItem('helper-async');

            setTimeout(() => {
                localStorage.setItem('helper-async', 'async-value');
            }, 200);
        });

        await expectLocalStorageValue(page, 'helper-string', 'ready');
        await expectLocalStorageValue(page, 'helper-regex', /pattern-\d+/);
        await expectLocalStorageValue(page, 'helper-async', 'async-value');

        await page.evaluate(() => {
            setTimeout(() => {
                localStorage.removeItem('helper-string');
                localStorage.removeItem('helper-regex');
                localStorage.removeItem('helper-async');
            }, 200);
        });

        await expectLocalStorageValue(page, 'helper-string', null);
        await expectLocalStorageValue(page, 'helper-regex', null);
        await expectLocalStorageCleared(page, 'helper-async');
    });
});
