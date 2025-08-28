import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Manage Processes', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('lists and previews built-in processes', async ({ page }) => {
        await page.goto('/processes/manage');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);
        const firstRow = page.locator('.process-row').first();
        await expect(firstRow).toBeVisible();
        await firstRow.locator('.preview-button').click();
        await expect(firstRow.locator('.process-preview')).toBeVisible();
    });
});
