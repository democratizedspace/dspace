import { test, expect } from '@playwright/test';

test('unpinned menu toggles via touch', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const unpinnedItem = page.locator('nav a[href="/gamesaves"]');
  await expect(unpinnedItem).toBeHidden();

  await page.locator('#unpinned-toggle').tap();

  await expect(unpinnedItem).toBeVisible();
});
