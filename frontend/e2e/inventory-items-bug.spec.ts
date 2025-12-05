import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

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
        await page.waitForSelector('[data-hydrated="true"]', { timeout: 10000 });

        // Check the "Show all items" checkbox
        const showAllCheckbox = page.locator('input[type="checkbox"]').first();
        await expect(showAllCheckbox).toBeVisible();
        await showAllCheckbox.check();

        // Wait a moment for reactive updates
        await page.waitForTimeout(500);

        // Verify items are now displayed
        // Items are displayed via ItemList component which uses ItemCard components
        const itemCards = page.locator('[class*="item"]').filter({ hasText: /aquarium|tool|hydroponic|award/ });
        
        // Should have at least one item visible (out of 257 total)
        await expect(itemCards.first()).toBeVisible({ timeout: 5000 });
        
        // Count visible items
        const count = await itemCards.count();
        expect(count).toBeGreaterThan(0);
        
        console.log(`✓ Successfully displayed ${count} items`);
    });

    test('inventory page should show empty state when "Show all items" is unchecked and user has no items', async ({
        page,
    }) => {
        // Navigate to inventory page
        await page.goto('/inventory');
        await page.waitForLoadState('networkidle');

        // Wait for component hydration
        await page.waitForSelector('[data-hydrated="true"]', { timeout: 10000 });

        // With a fresh/empty game state, no items should be displayed
        const showAllCheckbox = page.locator('input[type="checkbox"]').first();
        await expect(showAllCheckbox).toBeVisible();
        await expect(showAllCheckbox).not.toBeChecked();

        // No item cards should be visible when checkbox is unchecked and inventory is empty
        const itemCards = page.locator('[class*="ItemCard"]');
        const count = await itemCards.count();
        
        // This is expected - user has no items in their inventory
        expect(count).toBe(0);
        
        console.log('✓ Correctly showing empty inventory state');
    });

    test('inventory page items should be searchable after checking "Show all items"', async ({
        page,
    }) => {
        // Navigate to inventory page
        await page.goto('/inventory');
        await page.waitForLoadState('networkidle');

        // Wait for component hydration
        await page.waitForSelector('[data-hydrated="true"]', { timeout: 10000 });

        // Check "Show all items"
        const showAllCheckbox = page.locator('input[type="checkbox"]').first();
        await showAllCheckbox.check();
        await page.waitForTimeout(500);

        // Find the search input
        const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
        
        if (await searchInput.count() > 0) {
            // Search for "aquarium"
            await searchInput.fill('aquarium');
            await page.waitForTimeout(500);

            // Verify filtered results
            const itemCards = page.locator('[class*="item"]').filter({ hasText: /aquarium/i });
            const count = await itemCards.count();
            
            expect(count).toBeGreaterThan(0);
            console.log(`✓ Search returned ${count} aquarium items`);
        }
    });
});
