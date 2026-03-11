import { expect, test } from '@playwright/test';
import items from '../src/pages/inventory/json/items/index.js';
import { clearUserData, waitForHydration } from './test-helpers';

type ItemDef = { id: string; name: string; price?: string };

const allItems = items as ItemDef[];
const dUSDId = allItems.find((item) => item.name === 'dUSD')?.id;
const tradableItem = allItems.find((item) => {
    if (item.name === 'dUSD' || typeof item.price !== 'string' || !item.price.includes('dUSD')) {
        return false;
    }

    const numericPrice = Number.parseFloat(item.price);
    return Number.isFinite(numericPrice) && numericPrice > 0;
});

if (!dUSDId || !tradableItem) {
    throw new Error('Expected dUSD and at least one tradable item for multi-tab sync test.');
}

test.describe('multi-tab game state sync', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('buying in two tabs does not overwrite first purchase', async ({ browser, baseURL }) => {
        const context = await browser.newContext();
        const tabA = await context.newPage();
        const tabB = await context.newPage();

        const itemUrl = `${baseURL}/inventory/item/${tradableItem.id}`;
        await Promise.all([tabA.goto(itemUrl), tabB.goto(itemUrl)]);
        await Promise.all([waitForHydration(tabA), waitForHydration(tabB)]);

        await tabA.getByTestId('transaction-cta').click();
        await tabA.waitForTimeout(250);

        await tabB.getByTestId('transaction-cta').click();
        await tabB.waitForTimeout(250);

        const finalInventoryCount = await tabB.evaluate((itemId) => {
            const raw = localStorage.getItem('gameState');
            if (!raw) {
                return 0;
            }

            const parsed = JSON.parse(raw);
            return Number(parsed?.inventory?.[itemId] ?? 0);
        }, tradableItem.id);

        expect(finalInventoryCount).toBe(2);
        await context.close();
    });
});
