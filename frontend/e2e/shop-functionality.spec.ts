import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';
import items from '../src/pages/inventory/json/items/index.js';

type ShopItem = { id: string; name: string };
const itemsList = items as ShopItem[];
const [firstShopItem] = itemsList;
if (!firstShopItem) {
    throw new Error('Expected at least one shop item for tests');
}

test.describe('Shop Functionality', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('shop page should load with buy/sell options', async ({ page }) => {
        await page.goto('/shop');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await expect(page.getByRole('heading', { level: 2, name: 'Shop' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Buy' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Sell' })).toBeVisible();
    });

    test('shop featured card links to real item ids', async ({ page }) => {
        await page.goto('/shop');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const featuredActions = page.getByTestId('shop-featured-card-actions');

        const featuredBuyLink = featuredActions.getByRole('link', { name: /^Buy$/ });
        await expect(featuredBuyLink).toHaveAttribute('href', `/shop/buy/${firstShopItem.id}`);

        const featuredSellLink = featuredActions.getByRole('link', { name: /^Sell$/ });
        await expect(featuredSellLink).toHaveAttribute('href', `/shop/sell/${firstShopItem.id}`);
    });

    test('should navigate to buy page and display items for purchase', async ({ page }) => {
        await page.goto(`/shop/buy/${firstShopItem.id}`);
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await expect(page.getByRole('heading', { level: 2, name: 'Buy' })).toBeVisible();
        await expect(page.getByRole('spinbutton', { name: 'Quantity' })).toBeVisible();
    });

    test('should generate a buy link for the requested quantity', async ({ page }) => {
        await page.goto(`/shop/buy/${firstShopItem.id}`);
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const quantityInput = page.getByRole('spinbutton', { name: 'Quantity' });
        await quantityInput.fill('3');
        await page.getByRole('button', { name: /Generate buy link/i }).click();

        const generatedLink = page
            .getByTestId('shop-link-output')
            .getByRole('link', { name: /Buy 3/ });
        await expect(generatedLink).toHaveAttribute('href', `/shop/buy/${firstShopItem.id}/3`);
        await expect(generatedLink).toContainText('Buy 3');

        await Promise.all([page.waitForLoadState('networkidle'), generatedLink.click()]);
        await expect(
            page.getByRole('heading', { level: 2, name: 'Purchase successful!' })
        ).toBeVisible();
    });

    test('should navigate to sell page and list inventory items', async ({ page }) => {
        await page.goto(`/shop/sell/${firstShopItem.id}`);
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await expect(page.getByRole('heading', { level: 2, name: 'Sell' })).toBeVisible();
        await expect(page.getByRole('spinbutton', { name: 'Quantity' })).toBeVisible();
    });

    test('should generate a sell link for the requested quantity', async ({ page }) => {
        await page.goto(`/shop/sell/${firstShopItem.id}`);
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const quantityInput = page.getByRole('spinbutton', { name: 'Quantity' });
        await quantityInput.fill('2');
        await page.getByRole('button', { name: /Generate sell link/i }).click();

        const generatedLink = page
            .getByTestId('shop-link-output')
            .getByRole('link', { name: /Sell 2/ });
        await expect(generatedLink).toHaveAttribute('href', `/shop/sell/${firstShopItem.id}/2`);
        await expect(generatedLink).toContainText('Sell 2');

        await Promise.all([page.waitForLoadState('networkidle'), generatedLink.click()]);
        await expect(
            page.getByRole('heading', { level: 2, name: 'Sale successful!' })
        ).toBeVisible();
    });
});
