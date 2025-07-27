import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Manage Quests Search', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('filters quests by search term', async ({ page }) => {
        const titles = ['Search Quest A', 'Search Quest B'];
        for (const title of titles) {
            await page.goto('/quests/create');
            await page.fill('#title', title);
            await page.fill('#description', 'desc');
            const submit = page.locator('button.submit-button, input[type="submit"]').first();
            await submit.click();
            await page.waitForLoadState('networkidle');
        }

        await page.goto('/quests/manage');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const search = page.locator('input[placeholder="Search quests..."]');
        await search.fill('Quest B');

        const quests = page.locator('.quest-item');
        await expect(quests).toHaveCount(1);
        await expect(quests.first()).toContainText('Quest B');

        await search.fill('NoMatch');
        await expect(page.locator('.no-quests')).toBeVisible();
    });
});
