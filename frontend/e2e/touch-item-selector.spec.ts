import { test, expect } from '@playwright/test';
import { createTestItems, waitForHydration } from './test-helpers';

// Ensure touch events are enabled
test.use({ hasTouch: true });

test('item selector can be used with touch events', async ({ page }) => {
    await createTestItems(page, 1);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/processes/create');
    await page.waitForLoadState('networkidle');
    await waitForHydration(page);

    await page.fill('#title', `Touch Process ${Date.now()}`);
    await page.fill('#duration', '1h');

    // Add a created item row
    await page.locator('button:has-text("Add Created Item")').click();

    const selector = page.locator('.form-group:has-text("Created Items") .item-selector');
    await expect(selector).toHaveAttribute('data-hydrated', 'true');
    const openBtn = selector.locator('button').first();
    const openBox = await openBtn.boundingBox();
    if (openBox) {
        await page.touchscreen.tap(openBox.x + openBox.width / 2, openBox.y + openBox.height / 2);
    }
    await page.waitForTimeout(500);

    const itemRow = selector.locator('.item-row').first();
    const rowBox = await itemRow.boundingBox();
    if (rowBox) {
        await page.touchscreen.tap(rowBox.x + rowBox.width / 2, rowBox.y + rowBox.height / 2);
    }
    await page.waitForTimeout(500);

    await expect(selector.locator('.selected-item')).toBeVisible();
});
