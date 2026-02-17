import { expect, test } from '@playwright/test';
import { flushGameStateWrites, purgeClientState, waitForHydration } from './test-helpers';

const DUSD_ID = '5247a603-294a-4a34-a884-1ae20969b2a1';
const SAVINGS_JAR_ID = '66c2cdc6-9517-4c96-937f-1ddb4ee06ef3';
const BROKEN_JAR_ID = '6d4dfbe7-55c7-43bf-aba8-de7b05ff66a9';

test.describe('Savings jar mechanics', () => {
    async function seedGameState(page, seededState) {
        await page.evaluate(async (state) => {
            await new Promise((resolve, reject) => {
                const request = indexedDB.open('dspaceGameState', 1);
                request.onupgradeneeded = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains('state')) {
                        db.createObjectStore('state');
                    }
                    if (!db.objectStoreNames.contains('backup')) {
                        db.createObjectStore('backup');
                    }
                };
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    const db = request.result;
                    const tx = db.transaction(['state', 'backup'], 'readwrite');
                    tx.objectStore('state').put(state, 'root');
                    tx.objectStore('backup').put(state, 'root');
                    tx.oncomplete = () => {
                        db.close();
                        resolve(undefined);
                    };
                    tx.onerror = () => reject(tx.error);
                    tx.onabort = () => reject(tx.error);
                };
            });
        }, seededState);
    }

    async function startAndCollectProcess(page) {
        const startButton = page.getByTestId('process-start-button').first();
        await expect(startButton).toBeVisible();
        await startButton.click();

        const collectButton = page.getByRole('button', { name: 'Collect' }).first();
        await expect(collectButton).toBeVisible({ timeout: 15000 });
        await collectButton.click();
        await flushGameStateWrites(page);
    }

    async function readSavingsState(page) {
        return page.evaluate(
            async ({ dUsdId, savingsJarId, brokenJarId }) => {
                const saved = await new Promise((resolve) => {
                    const request = indexedDB.open('dspaceGameState', 1);
                    request.onerror = () => resolve(null);
                    request.onsuccess = () => {
                        const db = request.result;
                        const tx = db.transaction('state', 'readonly');
                        const getReq = tx.objectStore('state').get('root');
                        getReq.onsuccess = () => {
                            db.close();
                            resolve(getReq.result ?? null);
                        };
                        getReq.onerror = () => {
                            db.close();
                            resolve(null);
                        };
                    };
                });
                return {
                    dUsd: saved.inventory?.[dUsdId] ?? 0,
                    savingsJar: saved.inventory?.[savingsJarId] ?? 0,
                    brokenJar: saved.inventory?.[brokenJarId] ?? 0,
                    stored: saved.inventoryItemCounts?.[savingsJarId]?.[dUsdId] ?? 0,
                };
            },
            { dUsdId: DUSD_ID, savingsJarId: SAVINGS_JAR_ID, brokenJarId: BROKEN_JAR_ID }
        );
    }

    test.beforeEach(async ({ page }) => {
        await purgeClientState(page);
    });

    test('tracks stored dUSD and returns it when jar is broken', async ({ page }) => {
        const now = Date.now();
        await page.goto('/processes/save-dusd-in-jar');
        await seedGameState(page, {
            quests: {},
            inventory: {
                [DUSD_ID]: 25,
                [SAVINGS_JAR_ID]: 1,
            },
            inventoryItemCounts: {},
            processes: {},
            settings: {},
            versionNumberString: '3',
            _meta: { lastUpdated: now },
        });
        await flushGameStateWrites(page);
        await page.reload();
        await waitForHydration(page);
        await expect(
            page.getByRole('heading', {
                name: 'Deposit 10 dUSD into your savings jar',
                exact: true,
            })
        ).toBeVisible();

        const initialState = await readSavingsState(page);
        expect(initialState.stored).toBe(0);

        await startAndCollectProcess(page);

        await expect
            .poll(async () => {
                const state = await readSavingsState(page);
                return state.stored;
            })
            .toBe(10);

        await page.goto('/processes/break-savings-jar');
        await waitForHydration(page);

        await expect(
            page.getByRole('heading', {
                name: 'Break your savings jar to retrieve all stored dUSD',
                exact: true,
            })
        ).toBeVisible();
        await startAndCollectProcess(page);

        await expect
            .poll(async () => {
                const state = await readSavingsState(page);
                return {
                    savingsJar: state.savingsJar,
                    brokenJar: state.brokenJar,
                    stored: state.stored,
                };
            })
            .toEqual({ savingsJar: 0, brokenJar: 1, stored: 0 });

        const finalState = await readSavingsState(page);

        expect(finalState.dUsd).toBeCloseTo(25);
        expect(finalState.savingsJar).toBe(0);
        expect(finalState.brokenJar).toBe(1);
        expect(finalState.stored).toBe(0);
    });

    test('breaking an empty jar keeps dUSD unchanged and still creates broken jar', async ({
        page,
    }) => {
        const now = Date.now();
        await page.goto('/processes/break-savings-jar');
        await seedGameState(page, {
            quests: {},
            inventory: {
                [DUSD_ID]: 25,
                [SAVINGS_JAR_ID]: 1,
            },
            inventoryItemCounts: {
                [SAVINGS_JAR_ID]: {
                    [DUSD_ID]: 0,
                },
            },
            processes: {},
            settings: {},
            versionNumberString: '3',
            _meta: { lastUpdated: now },
        });
        await flushGameStateWrites(page);
        await page.reload();
        await waitForHydration(page);

        await expect(
            page.getByRole('heading', {
                name: 'Break your savings jar to retrieve all stored dUSD',
                exact: true,
            })
        ).toBeVisible();

        const initialState = await readSavingsState(page);
        expect(initialState.stored).toBe(0);

        await startAndCollectProcess(page);

        await expect
            .poll(async () => {
                const state = await readSavingsState(page);
                return {
                    savingsJar: state.savingsJar,
                    brokenJar: state.brokenJar,
                    stored: state.stored,
                };
            })
            .toEqual({ savingsJar: 0, brokenJar: 1, stored: 0 });

        const finalState = await readSavingsState(page);

        expect(finalState.dUsd).toBe(25);
        expect(finalState.savingsJar).toBe(0);
        expect(finalState.brokenJar).toBe(1);
        expect(finalState.stored).toBe(0);
    });
});
