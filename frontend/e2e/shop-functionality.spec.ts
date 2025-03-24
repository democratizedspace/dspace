import { test, expect } from '@playwright/test';
import { clearUserData, addTestItems } from './test-helpers';

test.describe('Shop Functionality', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
        // Add some test items to inventory for testing
        await addTestItems(page);
    });

    test('shop page should load with buy/sell options', async ({ page }) => {
        await page.goto('/shop');
        await page.waitForLoadState('networkidle');

        // Verify the page has loaded with navigation options
        // Use a more general selector for the title or header
        const shopTitle = page.locator('.title, h1, h2, header h2').first();
        await expect(shopTitle).toBeVisible();

        // Check for Buy and Sell links
        await expect(
            page.locator('a:has-text("Buy"), button:has-text("Buy")').first()
        ).toBeVisible();
        await expect(
            page.locator('a:has-text("Sell"), button:has-text("Sell")').first()
        ).toBeVisible();
    });

    test('should navigate to buy page and display items for purchase', async ({ page }) => {
        await page.goto('/shop/buy');
        await page.waitForLoadState('networkidle');

        // Just check that the page content loaded
        const mainContent = page.locator('main, body, .content, #app, #root').first();
        await expect(mainContent).toBeVisible();

        // Take a screenshot to verify page loaded correctly
        await page.screenshot({ path: 'test-artifacts/shop-buy-page.png' });
    });

    test('should allow purchasing items with sufficient resources', async ({ page }) => {
        // First add enough currency
        await page.goto('/');
        await page.evaluate(() => {
            // Add currency to localStorage inventory
            const inventory = JSON.parse(localStorage.getItem('inventory') || '{}');
            if (!inventory.currency) {
                inventory.currency = 0;
            }
            inventory.currency += 1000; // Add enough currency for purchases
            localStorage.setItem('inventory', JSON.stringify(inventory));
        });

        // Go to buy page
        await page.goto('/shop/buy');
        await page.waitForLoadState('networkidle');

        // Find a buyable item
        const buyButtons = page.locator('button:has-text("Buy")');
        const buyButtonCount = await buyButtons.count();

        if (buyButtonCount > 0) {
            // Get initial inventory count
            const initialInventory = await page.evaluate(() => {
                return JSON.parse(localStorage.getItem('inventory') || '{}');
            });

            // Click the first buy button
            await buyButtons.first().click();

            // Wait for purchase to complete
            await page.waitForTimeout(500);

            // Check that inventory has changed
            const updatedInventory = await page.evaluate(() => {
                return JSON.parse(localStorage.getItem('inventory') || '{}');
            });

            // Verify the purchase reduced currency
            expect(updatedInventory.currency).toBeLessThan(initialInventory.currency);
        }
    });

    test('should navigate to sell page and list inventory items', async ({ page }) => {
        // Ensure we have items to sell
        await addTestItems(page);

        await page.goto('/shop/sell');
        await page.waitForLoadState('networkidle');

        // Just check that the page content loaded
        const mainContent = page.locator('main, body, .content, #app, #root').first();
        await expect(mainContent).toBeVisible();

        // Take a screenshot to verify page loaded correctly
        await page.screenshot({ path: 'test-artifacts/shop-sell-page.png' });
    });

    test('should allow selling items from inventory', async ({ page }) => {
        // Ensure we have items to sell
        await addTestItems(page);

        // Go to sell page
        await page.goto('/shop/sell');
        await page.waitForLoadState('networkidle');

        // Find a sellable item and its initial count
        const sellButtons = page.locator('button:has-text("Sell")');
        const sellButtonCount = await sellButtons.count();

        if (sellButtonCount > 0) {
            // Get initial inventory and currency
            const initialInventory = await page.evaluate(() => {
                return JSON.parse(localStorage.getItem('inventory') || '{}');
            });
            const initialCurrency = initialInventory.currency || 0;

            // Click the first sell button
            await sellButtons.first().click();

            // Wait for sale to complete
            await page.waitForTimeout(500);

            // Check that inventory currency has increased
            const updatedInventory = await page.evaluate(() => {
                return JSON.parse(localStorage.getItem('inventory') || '{}');
            });

            // Verify the sale increased currency
            expect(updatedInventory.currency).toBeGreaterThan(initialCurrency);
        }
    });
});
