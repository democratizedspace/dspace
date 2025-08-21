import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('Settings route', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('loads settings page', async ({ page }) => {
        await page.goto('/settings');
        await expect(page.getByRole('heading', { level: 2, name: 'Settings' })).toBeVisible();
        await expect(page.getByRole('heading', { level: 2, name: 'Coming soon' })).toBeVisible();
    });
});
