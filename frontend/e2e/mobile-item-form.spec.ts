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

    const mainPadding = await page.evaluate(() => {
        const main = document.querySelector('main');
        return main ? getComputedStyle(main).paddingLeft : null;
    });
    expect(mainPadding).toBe('16px');

    const viewportWidth = page.viewportSize()?.width ?? 375;

    const alignment = await form.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const leftGap = rect.left;
        const rightGap = window.innerWidth - rect.right;
        return { leftGap, rightGap, rightEdge: rect.right };
    });

    expect(alignment.rightEdge).toBeLessThanOrEqual(viewportWidth - 16 + 0.5);
    expect(Math.abs(alignment.leftGap - alignment.rightGap)).toBeLessThanOrEqual(2);

    await page.screenshot({ path: './test-artifacts/mobile-item-form.png' });
});
