import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('Profile page', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('loads profile page', async ({ page }) => {
        await page.goto('/profile');
        await expect(page.getByText('Choose a default avatar')).toBeVisible();
    });
});
