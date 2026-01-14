import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';
import path from 'node:path';

const TEST_IMAGE = path.resolve(__dirname, '../test-data/test-image.jpg');

test.describe('Process item selector custom items', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('shows custom items in process selectors after inventory creation', async ({ page }) => {
        const itemName = `Backflip Device ${Date.now()}`;

        await page.goto('/inventory/create');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await page.fill('#name', itemName);
        await page.fill('#description', 'Custom item for process selector test.');
        await page.locator('#image').setInputFiles(TEST_IMAGE);
        await page.locator('button.submit-button').click();
        await page.waitForLoadState('networkidle');

        await page.goto('/inventory');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const showAllCheckbox = page.locator('input[type="checkbox"]').first();
        if (await showAllCheckbox.isVisible()) {
            await showAllCheckbox.check();
        }

        const searchInput = page
            .locator('input[type="search"], input[placeholder*="Search"]')
            .first();
        await expect(searchInput).toBeVisible();
        await searchInput.fill('backflip');

        await expect(page.locator('.item').filter({ hasText: 'Backflip Device' }).first()).toBeVisible({
            timeout: 5000,
        });

        await page.goto('/processes/create');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await page.locator('button:has-text("Add Required Item")').click();

        const selector = page.locator('.item-selector').last();
        await expect(selector).toHaveAttribute('data-hydrated', 'true');

        const toggle = selector.locator('button.select-button, button.edit-button');
        await toggle.click();

        const selectorSearch = selector.locator('input[placeholder*="Search"]');
        await expect(selectorSearch).toBeVisible();
        await selectorSearch.fill('backflip');

        const backflipOption = selector.locator('.item-row', { hasText: 'Backflip Device' }).first();
        await expect(backflipOption).toBeVisible();
    });
});
