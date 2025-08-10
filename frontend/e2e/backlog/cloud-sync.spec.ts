import { test, expect } from '@playwright/test';

// TODO: Cloud sync page functionality isn't working correctly; revisit this test when the feature is fixed.

test('cloud sync page renders', async ({ page }) => {
    await page.goto('/cloudsync');
    await expect(page.getByText('GitHub Token')).toBeVisible();
    await expect(page.getByRole('button', { name: /Upload/i })).toBeVisible();
});
