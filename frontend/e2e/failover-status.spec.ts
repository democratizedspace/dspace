import { test, expect } from '@playwright/test';

test('FailoverStatus displays online state by default', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const status = page.locator('[data-testid="connection-status"]');
    await expect(status).toHaveText('Online');
});
