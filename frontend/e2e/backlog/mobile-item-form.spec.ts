import { test, expect } from '@playwright/test';

// Verify the item creation form is usable on a small screen

test('item creation page is usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/inventory/create');
    await page.waitForLoadState('networkidle');

    const form = page.locator('form.item-form');
    await expect(form).toBeVisible();

    const padding = await form.evaluate((el) => getComputedStyle(el).paddingLeft);
    expect(padding).toBe('10px');

    await page.screenshot({ path: './test-artifacts/mobile-item-form.png' });
});
