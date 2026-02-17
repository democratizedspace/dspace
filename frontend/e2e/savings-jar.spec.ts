import { test, expect } from '@playwright/test';
import { registerClientStateHooks, waitForHydration } from './test-helpers';

registerClientStateHooks(test);

const jarId = '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec';
const brokenJarId = '8e10f8df-4fb5-4c75-8f4f-ae9ef6abc121';
const dusdId = '5247a603-294a-4a34-a884-1ae20969b2a1';

async function seedState(page, state: Record<string, unknown>) {
    await page.goto('/');
    await page.evaluate(async (nextState) => {
        const completeState = {
            quests: {},
            inventory: {},
            processes: {},
            itemContainerCounts: {},
            settings: {},
            versionNumberString: '3',
            _meta: { lastUpdated: Date.now() },
            ...nextState,
            _meta: { lastUpdated: Date.now() },
        };

        localStorage.setItem('gameState', JSON.stringify(completeState));
        localStorage.setItem('gameStateBackup', JSON.stringify(completeState));

        await new Promise<void>((resolve, reject) => {
            const request = indexedDB.open('dspaceGameState');
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains('state')) db.createObjectStore('state');
                if (!db.objectStoreNames.contains('backup')) db.createObjectStore('backup');
            };
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;
                const tx = db.transaction(['state', 'backup'], 'readwrite');
                tx.objectStore('state').put(completeState, 'root');
                tx.objectStore('backup').put(completeState, 'root');
                tx.oncomplete = () => {
                    db.close();
                    resolve();
                };
                tx.onerror = () => reject(tx.error);
            };
        });
    }, state);
}

test('deposit then break returns all stored dUSD and creates broken jar', async ({ page }) => {
    await seedState(page, { inventory: { [jarId]: 1, [dusdId]: 20 } });

    await page.goto('/processes/savings-jar-deposit');
    await waitForHydration(page);
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.getByRole('button', { name: 'Collect' })).toBeVisible({ timeout: 12_000 });
    await page.getByRole('button', { name: 'Collect' }).click();

    await page.goto(`/inventory/item/${jarId}`);
    await expect(page.getByText('Stored contents:')).toBeVisible();
    await expect(page.getByText(/dUSD: 10/)).toBeVisible();

    await page.goto('/processes/savings-jar-break');
    await waitForHydration(page);
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.getByRole('button', { name: 'Collect' })).toBeVisible({ timeout: 12_000 });
    await page.getByRole('button', { name: 'Collect' }).click();

    const snapshot = await page.evaluate(async () => {
        return await new Promise<Record<string, unknown>>((resolve) => {
            const req = indexedDB.open('dspaceGameState');
            req.onsuccess = () => {
                const tx = req.result.transaction('state', 'readonly');
                const getReq = tx.objectStore('state').get('root');
                getReq.onsuccess = () => resolve(getReq.result || {});
                getReq.onerror = () => resolve({});
            };
            req.onerror = () => resolve({});
        });
    });

    const inventory = (snapshot.inventory as Record<string, number>) || {};
    const containerCounts =
        (snapshot.itemContainerCounts as Record<string, Record<string, number>>) || {};

    expect(inventory[jarId] ?? 0).toBe(0);
    expect(inventory[brokenJarId] ?? 0).toBe(1);
    expect(inventory[dusdId] ?? 0).toBe(20);
    expect(containerCounts[jarId]?.[dusdId] ?? 0).toBe(0);
});

test('breaking empty jar creates broken jar without changing dUSD', async ({ page }) => {
    await seedState(page, {
        inventory: { [jarId]: 1, [dusdId]: 20 },
        itemContainerCounts: { [jarId]: { [dusdId]: 0 } },
    });

    await page.goto('/processes/savings-jar-break');
    await waitForHydration(page);
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.getByRole('button', { name: 'Collect' })).toBeVisible({ timeout: 12_000 });
    await page.getByRole('button', { name: 'Collect' }).click();

    const inventory = await page.evaluate(async (ids) => {
        const [jar, broken, dusd] = ids;
        return await new Promise<Record<string, number>>((resolve) => {
            const req = indexedDB.open('dspaceGameState');
            req.onsuccess = () => {
                const tx = req.result.transaction('state', 'readonly');
                const getReq = tx.objectStore('state').get('root');
                getReq.onsuccess = () => {
                    const state = getReq.result || {};
                    resolve(state.inventory || {});
                };
                getReq.onerror = () => resolve({ [jar]: 0, [broken]: 0, [dusd]: 0 });
            };
            req.onerror = () => resolve({ [jar]: 0, [broken]: 0, [dusd]: 0 });
        });
    }, [jarId, brokenJarId, dusdId]);

    expect(inventory[jarId] ?? 0).toBe(0);
    expect(inventory[brokenJarId] ?? 0).toBe(1);
    expect(inventory[dusdId] ?? 0).toBe(20);
});
