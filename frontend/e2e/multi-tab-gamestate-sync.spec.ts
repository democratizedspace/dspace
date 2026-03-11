import { expect, test } from '@playwright/test';
import items from '../src/pages/inventory/json/items/index.js';
import { clearUserData } from './test-helpers';

const DUSD_ID = '5247a603-294a-4a34-a884-1ae20969b2a1';
const targetItem = (items as Array<{ id: string; name: string; price?: string }>).find((item) => {
    if (!item.price || item.name === 'dUSD') return false;
    const [amount, symbol] = item.price.trim().split(/\s+/);
    return Number.parseFloat(amount) > 0 && symbol === 'dUSD';
});

if (!targetItem) {
    throw new Error('No purchasable dUSD item found for multi-tab sync test.');
}

const unitPrice = Number.parseFloat(String(targetItem.price).split(/\s+/)[0]);

async function seedGameState(page, dusd = 100) {
    await page.goto('/');
    await page.evaluate(
        async ({ currencyId, itemId, balance }) => {
            const db = await new Promise((resolve, reject) => {
                const request = indexedDB.open('dspaceGameState', 1);
                request.onupgradeneeded = () => {
                    const upgradeDb = request.result;
                    if (!upgradeDb.objectStoreNames.contains('state')) upgradeDb.createObjectStore('state');
                    if (!upgradeDb.objectStoreNames.contains('backup'))
                        upgradeDb.createObjectStore('backup');
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            const state = {
                quests: {},
                inventory: { [currencyId]: balance, [itemId]: 0 },
                processes: {},
                itemContainerCounts: {},
                settings: {},
                versionNumberString: '3',
                _meta: { lastUpdated: Date.now() },
            };

            await new Promise((resolve, reject) => {
                const tx = db.transaction(['state', 'backup'], 'readwrite');
                tx.objectStore('state').put(state, 'root');
                tx.objectStore('backup').put(state, 'root');
                tx.oncomplete = () => resolve(undefined);
                tx.onerror = () => reject(tx.error);
            });

            db.close();
        },
        { currencyId: DUSD_ID, itemId: targetItem.id, balance: dusd }
    );
}

test.describe('multi-tab gameState sync', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
        await seedGameState(page);
    });

    test('applies purchases from two tabs without stale overwrite', async ({ browser, page }) => {
        const context = page.context();
        const tabA = await context.newPage();
        const tabB = await context.newPage();

        await tabA.goto(`/inventory/item/${targetItem.id}`);
        await tabB.goto(`/inventory/item/${targetItem.id}`);

        await tabA.getByTestId('transaction-cta').click();
        await tabA.close();

        await tabB.getByTestId('transaction-cta').click();

        const finalState = await tabB.evaluate(async () => {
            const db = await new Promise((resolve, reject) => {
                const request = indexedDB.open('dspaceGameState', 1);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            const state = await new Promise<any>((resolve, reject) => {
                const tx = db.transaction('state', 'readonly');
                const request = tx.objectStore('state').get('root');
                request.onsuccess = () => resolve(request.result || {});
                request.onerror = () => reject(request.error);
            });

            db.close();
            return state;
        });

        expect(finalState.inventory[targetItem.id]).toBe(2);
        expect(finalState.inventory[DUSD_ID]).toBeCloseTo(100 - unitPrice * 2, 5);

        await tabB.close();
    });
});
