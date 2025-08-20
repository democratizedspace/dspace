import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('Profile Page', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('profile page loads', async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');
        await expect(page.getByText('Choose a default avatar')).toBeVisible();
    });
});
