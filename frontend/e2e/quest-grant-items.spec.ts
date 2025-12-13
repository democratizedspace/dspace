import { test, expect } from '@playwright/test';
import { purgeClientState, waitForHydration } from './test-helpers';

test.describe('Quest grant items regression', () => {
    test.beforeEach(async ({ page }) => {
        await purgeClientState(page);
    });

    test('shows grant item list for How to do quests', async ({ page }) => {
        await page.goto('/quests/welcome/howtodoquests');
        await waitForHydration(page);

        await page.getByRole('button', { name: /A quest, you say\? Tell me more\./i }).click();
        await page.getByRole('button', { name: /Alright, lay it on me, dChat\./i }).click();
        await page.getByRole('button', { name: /What's next\?/i }).click();

        const grantOption = page.getByRole('button', { name: /Great, free stuff! Thanks!/i });
        await expect(grantOption).toBeVisible();

        const itemList = grantOption.locator('.vertical.container');
        const rows = itemList.locator('.horizontal');
        await expect(rows.nth(0)).toContainText(/dCarbon/i);
        await expect(rows.nth(0)).toContainText(/10/);
        await expect(rows.nth(1)).toContainText(/dUSD/i);
        await expect(rows.nth(1)).toContainText(/100/);
    });
});
