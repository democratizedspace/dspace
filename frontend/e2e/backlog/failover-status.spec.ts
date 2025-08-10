import { test, expect } from '@playwright/test';

test('FailoverStatus reacts to offline mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const status = page.locator('[data-testid="connection-status"]');
    await expect(status).toHaveText('Online');

    await page.context().setOffline(true);
    await expect(status).toHaveText('Offline - changes will sync when connection restores');

    await page.context().setOffline(false);
    await expect(status).toHaveText('Online');
});
