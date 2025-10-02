import { test, expect } from '@playwright/test';

test.describe('touch navigation menu', () => {
    test.use({ hasTouch: true });

    test('unpinned menu toggles via touch', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const toggle = page.locator('#unpinned-toggle');
        const unpinnedItem = page.locator('nav a[href="/gamesaves"]');

        await expect(toggle).toBeVisible();
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(toggle).toHaveText('More');
        await expect(unpinnedItem).toBeHidden();

        await toggle.tap();

        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await expect(toggle).toHaveText('Less');
        await expect(unpinnedItem).toBeVisible();

        await toggle.tap();

        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(unpinnedItem).toBeHidden();
    });
});
