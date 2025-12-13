import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Profile page', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('loads profile page', async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);
        await expect(page.getByText('Choose a default avatar')).toBeVisible();
    });
});
