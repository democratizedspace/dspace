import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { clearUserData, flushGameStateWrites } from './test-helpers';

const JAR_ID = '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec';
const BROKEN_JAR_ID = 'f797d8de-11c5-4f89-a725-c2ac2255d173';
const DUSD_ID = '5247a603-294a-4a34-a884-1ae20969b2a1';

type GameStatePayload = {
    inventory?: Record<string, number>;
    itemContainerCounts?: Record<string, Record<string, number>>;
    [key: string]: unknown;
};

async function seedGameState(page: Page, state: GameStatePayload) {
    await page.goto('/');
    await page.evaluate(async (seed) => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open('dspaceGameState', 2);
            request.onupgradeneeded = () => {
                const upgradeDb = request.result;
                if (!upgradeDb.objectStoreNames.contains('state'))
                    upgradeDb.createObjectStore('state');
                if (!upgradeDb.objectStoreNames.contains('backup'))
                    upgradeDb.createObjectStore('backup');
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(['state', 'backup'], 'readwrite');
            tx.objectStore('state').put(seed, 'root');
            tx.objectStore('backup').put(seed, 'root');
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });

        db.close();
    }, state);
}

async function readGameState(page: Page): Promise<GameStatePayload> {
    return page.evaluate(async () => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open('dspaceGameState', 2);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        const state = await new Promise<GameStatePayload>((resolve, reject) => {
            const tx = db.transaction('state', 'readonly');
            const request = tx.objectStore('state').get('root');
            request.onsuccess = () => resolve(request.result || {});
            request.onerror = () => reject(request.error);
        });

        db.close();
        return state;
    });
}

async function readStoredDusdFromIdb(page: Page): Promise<number> {
    const state = await readGameState(page);
    return state.itemContainerCounts?.[JAR_ID]?.[DUSD_ID] ?? 0;
}

async function runProcessFromItemPage(page: Page, title: string) {
    const card = page
        .locator('.container')
        .filter({ has: page.getByRole('heading', { name: title, exact: true }) })
        .first();
    const start = card.getByTestId('process-start-button').first();
    const collect = card.getByRole('button', { name: 'Collect' }).first();

    await start.click();
    await expect(collect).toBeVisible({ timeout: 15000 });
    await collect.click();
    await flushGameStateWrites(page);
}

test.describe('savings jar mechanics', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('deposit then break returns stored dUSD and consumes jar', async ({ page }) => {
        await seedGameState(page, {
            quests: {},
            inventory: { [JAR_ID]: 1, [DUSD_ID]: 50 },
            processes: {},
            itemContainerCounts: {},
            settings: {},
            versionNumberString: '3',
            _meta: { lastUpdated: Date.now() },
        });

        await page.goto(`/inventory/item/${JAR_ID}`);
        await runProcessFromItemPage(page, 'Deposit 10 dUSD into savings jar');

        await expect.poll(async () => readStoredDusdFromIdb(page)).toBe(10);

        await page.goto(`/inventory/item/${JAR_ID}`);

        await expect(page.getByText('Stored contents:')).toBeVisible();
        await expect(page.getByText(/dUSD:\s*10(\.0+)?/)).toBeVisible();

        await runProcessFromItemPage(page, 'Break savings jar and retrieve all dUSD');

        await expect.poll(async () => readStoredDusdFromIdb(page)).toBe(0);
        await expect
            .poll(async () => {
                const state = await readGameState(page);
                return {
                    brokenJar: state.inventory?.[BROKEN_JAR_ID] ?? 0,
                    dusd: state.inventory?.[DUSD_ID] ?? 0,
                    jar: state.inventory?.[JAR_ID] ?? 0,
                };
            })
            .toEqual({ brokenJar: 1, dusd: 50, jar: 0 });

        const state = await readGameState(page);
        expect(state.inventory[JAR_ID]).toBe(0);
        expect(state.inventory[BROKEN_JAR_ID]).toBe(1);
        expect(state.inventory[DUSD_ID]).toBe(50);
        expect(state.itemContainerCounts[JAR_ID][DUSD_ID]).toBe(0);
    });

    test('breaking empty jar keeps dUSD unchanged', async ({ page }) => {
        await seedGameState(page, {
            quests: {},
            inventory: { [JAR_ID]: 1, [DUSD_ID]: 25 },
            processes: {},
            itemContainerCounts: { [JAR_ID]: { [DUSD_ID]: 0 } },
            settings: {},
            versionNumberString: '3',
            _meta: { lastUpdated: Date.now() },
        });

        await page.goto(`/inventory/item/${JAR_ID}`);
        await runProcessFromItemPage(page, 'Break savings jar and retrieve all dUSD');

        await expect.poll(async () => readStoredDusdFromIdb(page)).toBe(0);
        await expect
            .poll(async () => {
                const state = await readGameState(page);
                return {
                    brokenJar: state.inventory?.[BROKEN_JAR_ID] ?? 0,
                    dusd: state.inventory?.[DUSD_ID] ?? 0,
                    jar: state.inventory?.[JAR_ID] ?? 0,
                };
            })
            .toEqual({ brokenJar: 1, dusd: 25, jar: 0 });

        const state = await readGameState(page);
        expect(state.inventory[JAR_ID]).toBe(0);
        expect(state.inventory[BROKEN_JAR_ID]).toBe(1);
        expect(state.inventory[DUSD_ID]).toBe(25);
        expect(state.itemContainerCounts[JAR_ID][DUSD_ID]).toBe(0);
    });
});
