import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('Built-in Quests', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('energy/solar quest detail page should load', async ({ page }) => {
        await page.goto('/quests/energy/solar');
        await page.waitForLoadState('networkidle');
        const title = page.locator('h3');
        await expect(title).toHaveText(/solar/i);
    });
});
