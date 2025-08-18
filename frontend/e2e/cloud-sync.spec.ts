import { test, expect } from '@playwright/test';

test('cloud sync page renders', async ({ page }) => {
    await page.goto('/cloudsync');
    await expect(page.getByLabel(/GitHub Token/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Upload/i })).toBeVisible();
});
