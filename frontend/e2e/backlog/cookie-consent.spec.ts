import { test, expect } from '@playwright/test';

// TODO: Add full cookie consent flow once UI is finalized.
test('cookie consent page renders', async ({ page }) => {
    await page.goto('/accept_cookies');
    await expect(page.getByText('Accept cookies')).toBeVisible();
});
