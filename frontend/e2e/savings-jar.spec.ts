import { expect, test } from '@playwright/test';
import { purgeClientStorage } from './utils/idb';

const JAR_ID = '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec';
const BROKEN_JAR_ID = 'd6df111f-6d30-4720-ab2f-cd6f27e9e3f3';
const DUSD_ID = '5247a603-294a-4a34-a884-1ae20969b2a1';

async function seedGameState(page, state) {
    await page.evaluate(async (nextState) => {
        const request = indexedDB.open('dspaceGameState', 1);
        const db = await new Promise((resolve, reject) => {
            request.onupgradeneeded = () => {
                const upgradeDb = request.result;
                if (!upgradeDb.objectStoreNames.contains('state')) {
                    upgradeDb.createObjectStore('state');
                }
                if (!upgradeDb.objectStoreNames.contains('backup')) {
                    upgradeDb.createObjectStore('backup');
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction('state', 'readwrite');
            tx.objectStore('state').put(nextState, 'root');
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });

        db.close();
    }, state);
}

async function readGameState(page) {
    return page.evaluate(async () => {
        const request = indexedDB.open('dspaceGameState', 1);
        const db = await new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        const gameState = await new Promise((resolve, reject) => {
            const tx = db.transaction('state', 'readonly');
            const getRequest = tx.objectStore('state').get('root');
            getRequest.onsuccess = () => resolve(getRequest.result);
            getRequest.onerror = () => reject(getRequest.error);
        });

        db.close();
        return gameState;
    });
}

async function runProcess(page, processId: string) {
    await page.goto(`/processes/${processId}`);
    await page.getByRole('button', { name: 'Start' }).click();
    await page.getByRole('button', { name: 'Collect' }).click({ timeout: 10_000 });
}

test.describe('savings jar processes', () => {
    test.beforeEach(async ({ page }) => {
        await purgeClientStorage(page);
    });

    test('deposit then break returns funds and clears stored balance', async ({ page }) => {
        await seedGameState(page, {
            quests: {},
            inventory: { [JAR_ID]: 1, [DUSD_ID]: 30 },
            processes: {},
            itemContainerCounts: { [JAR_ID]: { [DUSD_ID]: 0 } },
            settings: {},
            versionNumberString: '3',
            _meta: { lastUpdated: Date.now() },
        });

        await runProcess(page, 'savings-jar-deposit');
        await runProcess(page, 'savings-jar-break');

        await expect.poll(() => readGameState(page)).toMatchObject({
            inventory: {
                [JAR_ID]: 0,
                [BROKEN_JAR_ID]: 1,
                [DUSD_ID]: 30,
            },
            itemContainerCounts: {
                [JAR_ID]: {
                    [DUSD_ID]: 0,
                },
            },
        });
    });

    test('breaking an empty jar keeps dUSD unchanged', async ({ page }) => {
        await seedGameState(page, {
            quests: {},
            inventory: { [JAR_ID]: 1, [DUSD_ID]: 12 },
            processes: {},
            itemContainerCounts: { [JAR_ID]: { [DUSD_ID]: 0 } },
            settings: {},
            versionNumberString: '3',
            _meta: { lastUpdated: Date.now() },
        });

        await runProcess(page, 'savings-jar-break');

        await expect.poll(() => readGameState(page)).toMatchObject({
            inventory: {
                [JAR_ID]: 0,
                [BROKEN_JAR_ID]: 1,
                [DUSD_ID]: 12,
            },
            itemContainerCounts: {
                [JAR_ID]: {
                    [DUSD_ID]: 0,
                },
            },
        });
    });
});
