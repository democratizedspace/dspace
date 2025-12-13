import { test, expect } from '@playwright/test';
import { createTestItems, waitForHydration } from './test-helpers';

// Ensure touch events are enabled and simulate a mobile viewport
test.use({ hasTouch: true, isMobile: true });

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
    const listboxLocator = selector.locator('[role="listbox"]');

    if ((await listboxLocator.count()) === 0) {
        const toggleButton = selector.locator('.select-button, .edit-button').first();
        await toggleButton.tap();
    }

    const listbox = selector.locator('[role="listbox"]');
    await expect(listbox).toBeVisible();

    const firstOption = listbox.locator('[role="option"]').first();
    let optionLabel = (await firstOption.locator('h3').first().innerText()).trim();
    if (!optionLabel) {
        optionLabel = (await firstOption.innerText()).trim();
    }
    await firstOption.tap();

    const selectedItem = selector.locator('.selected-item');
    await expect(selectedItem).toBeVisible({ timeout: 15000 });
    await expect(selectedItem).toContainText(optionLabel);

    const editButton = selector.locator('.edit-button');
    await expect(editButton).toBeVisible({ timeout: 15000 });
    await editButton.tap();
    await expect(selector.locator('[role="listbox"]')).toBeVisible();
});
