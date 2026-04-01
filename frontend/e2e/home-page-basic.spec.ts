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

        const latestUpdate = page.getByRole('heading', { name: /latest update/i });
        await expect(latestUpdate).toBeVisible();
    });
});
