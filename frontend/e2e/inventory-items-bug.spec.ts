import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Inventory Items Display - Bug Fix Verification', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('inventory page should display items when "Show all items" checkbox is checked', async ({
        page,
    }) => {
        // Navigate to inventory page
        await page.goto('/inventory');
        await page.waitForLoadState('networkidle');

        // Wait for component hydration
        await waitForHydration(page);

        // Check the "Show all items" checkbox
        const showAllCheckbox = page.locator('input[type="checkbox"]').first();
        await expect(showAllCheckbox).toBeVisible();
        await showAllCheckbox.check();

        // Wait for items to appear after checkbox is checked
        const itemCards = page.locator('.item');
        await expect(itemCards.first()).toBeVisible({ timeout: 5000 });

        // Count visible items
        const count = await itemCards.count();
        expect(count).toBeGreaterThan(0);
    });

    test('inventory page should show empty state when "Show all items" is unchecked and user has no items', async ({
        page,
    }) => {
        // Navigate to inventory page
        await page.goto('/inventory');
        await page.waitForLoadState('networkidle');

        // Wait for component hydration
        await waitForHydration(page);

        // With a fresh/empty game state, no items should be displayed
        const showAllCheckbox = page.locator('input[type="checkbox"]').first();
        await expect(showAllCheckbox).toBeVisible();
        await expect(showAllCheckbox).not.toBeChecked();

        // No item cards should be visible when checkbox is unchecked and inventory is empty
        const itemCards = page.locator('.item');
        const count = await itemCards.count();

        // This is expected - user has no items in their inventory
        expect(count).toBe(0);
    });

    test('inventory page items should be searchable after checking "Show all items"', async ({
        page,
    }) => {
        // Navigate to inventory page
        await page.goto('/inventory');
        await page.waitForLoadState('networkidle');

        // Wait for component hydration
        await waitForHydration(page);

        // Check "Show all items"
        const showAllCheckbox = page.locator('input[type="checkbox"]').first();
        await showAllCheckbox.check();

        // Wait for item cards to appear after checking the checkbox
        const itemCards = page.locator('.item');
        await expect(itemCards.first()).toBeVisible({ timeout: 5000 });

        // Find the search input
        const searchInput = page
            .locator('input[type="search"], input[placeholder*="Search"]')
            .first();
        await expect(searchInput).toBeVisible();

        // Search for "aquarium"
        await searchInput.fill('aquarium');

        // Verify filtered results
        const filteredItems = page.locator('.item').filter({ hasText: /aquarium/i });
        await expect(filteredItems.first()).toBeVisible({ timeout: 5000 });

        const count = await filteredItems.count();
        expect(count).toBeGreaterThan(0);
    });
});
