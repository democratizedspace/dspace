import { test, expect } from '@playwright/test';

// Verify the process creation form layout on mobile

test('process creation page is usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/processes/create');
    await page.waitForLoadState('networkidle');

    const form = page.locator('form.process-form');
    await expect(form).toBeVisible();

    const padding = await form.evaluate((el) => getComputedStyle(el).paddingLeft);
    expect(padding).toBe('10px');

    await page.screenshot({ path: './test-artifacts/mobile-process-form.png' });
});
