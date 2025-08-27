import { test } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('Logout flow', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('placeholder for logout flow', async ({ page }) => {
        await page.goto('/');
        // TODO: implement logout steps once available
    });
});
