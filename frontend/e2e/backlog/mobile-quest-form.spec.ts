import { test, expect } from '@playwright/test';

test('quest creation page is usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/quests/create');
    await page.waitForLoadState('networkidle');

    const form = page.locator('form.quest-form');
    await expect(form).toBeVisible();

    // Ensure mobile-specific padding is applied
    const padding = await form.evaluate((el) => getComputedStyle(el).paddingLeft);
    expect(padding).toBe('10px');

    await page.screenshot({ path: './test-artifacts/mobile-quest-form.png' });
});
