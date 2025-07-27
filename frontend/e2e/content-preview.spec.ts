import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('Custom content preview', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('item form shows live preview', async ({ page }) => {
        await page.goto('/inventory/create');
        await page.fill('#name', 'Preview Item');
        await page.fill('#description', 'Preview description');
        const preview = page.locator('.item-preview');
        await expect(preview).toBeVisible();
    });

    test('process form preview appears on demand', async ({ page }) => {
        await page.goto('/processes/create');
        await page.fill('#title', 'Preview Process');
        await page.fill('#duration', '1h');
        const button = page.locator('button.preview-button');
        await button.click();
        const preview = page.locator('.process-preview');
        await expect(preview).toBeVisible();
    });
});
