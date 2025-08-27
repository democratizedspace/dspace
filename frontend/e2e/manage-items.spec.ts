import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Manage Items', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('lists items on manage page', async ({ page }) => {
        await page.goto('/inventory/manage');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);
        await expect(page.getByRole('heading', { name: /manage items/i })).toBeVisible();
        await expect(page.locator('.item-row').first()).toBeVisible();
    });
});
