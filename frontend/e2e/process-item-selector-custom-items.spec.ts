import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const customItemName = 'Backflip Device';

test.describe('Process item selectors include custom items', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('required item selector finds custom items', async ({ page }) => {
        await page.goto('/inventory/create');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await page.fill('#name', customItemName);
        await page.fill('#description', 'Custom item for process selector regression test.');
        await page.click('button.submit-button');
        await page.waitForLoadState('networkidle');

        await page.goto('/inventory');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const showAllCheckbox = page.locator('input[type="checkbox"]').first();
        if (await showAllCheckbox.isVisible()) {
            await showAllCheckbox.check();
        }

        const inventorySearch = page
            .locator('input[type="search"], input[placeholder*="Search"]')
            .first();
        await inventorySearch.fill('backflip');
        await expect(page.locator('.item').filter({ hasText: customItemName })).toBeVisible({
            timeout: 5000,
        });

        await page.goto('/processes/create');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await page.click('button:has-text("Add Required Item")');
        const selector = page.locator('.item-row').first();
        const selectorSearch = selector.locator('input[aria-label="Search items"]');
        await selectorSearch.fill('backflip');

        await expect(
            selector.locator('.item-row', { hasText: customItemName })
        ).toBeVisible({ timeout: 5000 });
    });
});
