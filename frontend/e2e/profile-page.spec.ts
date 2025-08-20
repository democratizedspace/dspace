import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('Profile Page', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('should display avatar selection message', async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');

        const message = page.getByText(/choose a default avatar/i);
        await expect(message).toBeVisible();
    });
});
