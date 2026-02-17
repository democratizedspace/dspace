import { expect, test } from '@playwright/test';
import { purgeClientState, waitForHydration } from './test-helpers';

const JAR_ID = '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec';
const DUSD_ID = '5247a603-294a-4a34-a884-1ae20969b2a1';
const BROKEN_JAR_ID = 'a7a906ff-1dd9-4d0d-a67f-4fa4735d2f4a';

async function seedGameState(page, state: Record<string, unknown>) {
    await page.evaluate(async (value) => {
        await new Promise<void>((resolve, reject) => {
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
                const tx = db.transaction(['state'], 'readwrite');
                tx.objectStore('state').put(value, 'root');
                tx.oncomplete = () => {
                    db.close();
                    resolve();
                };
                tx.onerror = () => reject(tx.error);
            };
        });
    }, state);
}

async function readState(page) {
    return page.evaluate(
        () =>
            new Promise<Record<string, unknown> | undefined>((resolve, reject) => {
                const request = indexedDB.open('dspaceGameState', 1);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    const db = request.result;
                    const tx = db.transaction(['state'], 'readonly');
                    const getReq = tx.objectStore('state').get('root');
                    getReq.onsuccess = () => {
                        db.close();
                        resolve(getReq.result);
                    };
                    getReq.onerror = () => reject(getReq.error);
                };
            })
    );
}

async function runProcess(page, slug: string) {
    await page.goto(`/processes/${slug}`);
    await waitForHydration(page);
    await expect(page.getByTestId('process-start-button')).toBeVisible();
    await page.getByTestId('process-start-button').click();
    await expect(page.getByText('Collect')).toBeVisible({ timeout: 10000 });
    await page.getByText('Collect').click();
}

test.describe('savings jar mechanics', () => {
    test.beforeEach(async ({ page }) => {
        await purgeClientState(page);
    });

    test('deposit then break round-trips dUSD via jar storage', async ({ page }) => {
        const baseState = {
            quests: {},
            inventory: {
                [JAR_ID]: 1,
                [DUSD_ID]: 20,
            },
            processes: {},
            itemContainerCounts: {},
            settings: {},
            versionNumberString: 'test',
            __meta: { lastUpdated: Date.now() },
        };

        await seedGameState(page, baseState);

        await runProcess(page, 'savings-jar-deposit');

        await expect
            .poll(async () => {
                const state = (await readState(page)) as Record<string, unknown>;
                const typed = state as {
                    itemContainerCounts?: Record<string, Record<string, number>>;
                };
                return typed.itemContainerCounts?.[JAR_ID]?.[DUSD_ID] ?? 0;
            })
            .toBe(10);

        await runProcess(page, 'savings-jar-break');

        await expect
            .poll(async () => {
                const state = (await readState(page)) as Record<string, unknown>;
                const typed = state as {
                    inventory?: Record<string, number>;
                    itemContainerCounts?: Record<string, Record<string, number>>;
                };
                return {
                    jar: typed.inventory?.[JAR_ID] ?? 0,
                    broken: typed.inventory?.[BROKEN_JAR_ID] ?? 0,
                    dusd: typed.inventory?.[DUSD_ID] ?? 0,
                    stored: typed.itemContainerCounts?.[JAR_ID]?.[DUSD_ID] ?? 0,
                };
            })
            .toEqual({ jar: 0, broken: 1, dusd: 20, stored: 0 });
    });

    test('breaking an empty jar does not change dUSD balance', async ({ page }) => {
        const baseState = {
            quests: {},
            inventory: {
                [JAR_ID]: 1,
                [DUSD_ID]: 20,
            },
            processes: {},
            itemContainerCounts: {
                [JAR_ID]: {
                    [DUSD_ID]: 0,
                },
            },
            settings: {},
            versionNumberString: 'test',
            __meta: { lastUpdated: Date.now() },
        };

        await seedGameState(page, baseState);
        await runProcess(page, 'savings-jar-break');

        await expect
            .poll(async () => {
                const state = (await readState(page)) as Record<string, unknown>;
                const typed = state as {
                    inventory?: Record<string, number>;
                    itemContainerCounts?: Record<string, Record<string, number>>;
                };
                return {
                    broken: typed.inventory?.[BROKEN_JAR_ID] ?? 0,
                    dusd: typed.inventory?.[DUSD_ID] ?? 0,
                    stored: typed.itemContainerCounts?.[JAR_ID]?.[DUSD_ID] ?? 0,
                };
            })
            .toEqual({ broken: 1, dusd: 20, stored: 0 });
    });
});
