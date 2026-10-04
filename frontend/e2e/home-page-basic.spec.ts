import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Home Page Basic Rendering', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('should display the latest update section', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const latestUpdate = page.getByRole('heading', {
            name: 'Latest update: April 1, 2026',
            exact: true,
        });
        await expect(latestUpdate).toBeVisible();
        await expect(page.locator('.latest-update-html')).toContainText('v3.0.1');
        await expect(page.locator('.latest-update-html')).not.toContainText('v3.1.0');
        await expect(page.getByRole('complementary', { name: 'Historical note' })).toHaveCount(0);
    });
});
