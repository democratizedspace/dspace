import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('Settings Page', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('renders settings options', async ({ page }) => {
        await page.goto('/settings');
        await expect(page.locator('h2:has-text("Account")')).toBeVisible();
        await expect(page.locator('a:has-text("Profile")')).toBeVisible();
    });
});
