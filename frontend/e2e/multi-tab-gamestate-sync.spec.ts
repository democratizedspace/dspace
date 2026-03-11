import { expect, test } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';
import items from '../src/pages/inventory/json/items/index.js';

type CatalogItem = { id: string; name: string; price?: string };
const catalog = items as CatalogItem[];
const dUSDId = catalog.find((item) => item.name === 'dUSD')?.id;
const buyableItem = catalog.find((item) => {
    if (!item.price || item.name === 'dUSD') {
        return false;
    }

    return item.price.includes('dUSD');
});

if (!dUSDId || !buyableItem?.price) {
    throw new Error('Expected dUSD and at least one dUSD-priced item for multi-tab sync tests.');
}

const unitPrice = Number.parseFloat(buyableItem.price.split(' ')[0] ?? '0');
if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    throw new Error(`Expected a positive dUSD unit price, got: ${buyableItem.price}`);
}

const setSeededInventory = async (page, dUSD: number, itemCount: number) => {
    await page.goto('/');
    await page.evaluate(
        ({ currencyId, targetItemId, balance, count }) => {
            const seededState = {
                quests: {},
                inventory: {
                    [currencyId]: balance,
                    [targetItemId]: count,
                },
                processes: {},
                itemContainerCounts: {},
                settings: {},
                versionNumberString: '3',
                _meta: {
                    lastUpdated: Date.now(),
                },
            };
            localStorage.setItem('gameState', JSON.stringify(seededState));
            localStorage.removeItem('gameStateChecksum');
        },
        { currencyId: dUSDId, targetItemId: buyableItem.id, balance: dUSD, count: itemCount }
    );
};

test.describe('multi-tab gameState synchronization', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('second tab purchase does not overwrite first tab purchase', async ({ context, page }) => {
        await setSeededInventory(page, unitPrice * 5, 0);

        const firstTab = await context.newPage();
        const secondTab = await context.newPage();

        await firstTab.goto(`/inventory/item/${buyableItem.id}`);
        await secondTab.goto(`/inventory/item/${buyableItem.id}`);
        await waitForHydration(firstTab);
        await waitForHydration(secondTab);

        await firstTab.getByTestId('transaction-cta').click();
        await firstTab.close();
        await secondTab.getByTestId('transaction-cta').click();

        const inventory = await secondTab.evaluate(
            ({ currencyId, targetItemId }) => {
                const stored = JSON.parse(localStorage.getItem('gameState') || '{}');
                return {
                    dUSD: Number(stored?.inventory?.[currencyId] ?? 0),
                    item: Number(stored?.inventory?.[targetItemId] ?? 0),
                };
            },
            { currencyId: dUSDId, targetItemId: buyableItem.id }
        );

        expect(inventory.item).toBe(2);
        expect(inventory.dUSD).toBeCloseTo(unitPrice * 3, 6);
    });

    test('stale tab cannot buy without sufficient dUSD after another tab spends it', async ({
        context,
        page,
    }) => {
        await setSeededInventory(page, unitPrice, 0);

        const firstTab = await context.newPage();
        const secondTab = await context.newPage();

        await firstTab.goto(`/inventory/item/${buyableItem.id}`);
        await secondTab.goto(`/inventory/item/${buyableItem.id}`);
        await waitForHydration(firstTab);
        await waitForHydration(secondTab);

        await firstTab.getByTestId('transaction-cta').click();
        await expect
            .poll(
                async () =>
                    secondTab.evaluate((currencyId) => {
                        const stored = JSON.parse(localStorage.getItem('gameState') || '{}');
                        return Number(stored?.inventory?.[currencyId] ?? 0);
                    }, dUSDId),
                { timeout: 5000 }
            )
            .toBeCloseTo(0, 6);

        await secondTab.getByTestId('transaction-cta').click();

        const inventory = await secondTab.evaluate(
            ({ currencyId, targetItemId }) => {
                const stored = JSON.parse(localStorage.getItem('gameState') || '{}');
                return {
                    dUSD: Number(stored?.inventory?.[currencyId] ?? 0),
                    item: Number(stored?.inventory?.[targetItemId] ?? 0),
                };
            },
            { currencyId: dUSDId, targetItemId: buyableItem.id }
        );

        expect(inventory.item).toBe(1);
        expect(inventory.dUSD).toBeCloseTo(0, 6);
    });
});
