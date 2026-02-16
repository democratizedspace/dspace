import { expect, test } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const DUSD_ID = '5247a603-294a-4a34-a884-1ae20969b2a1';
const SAVINGS_JAR_ID = '7fe0d9c4-6b61-4e4f-b26d-2f150f95c6c9';
const BROKEN_JAR_ID = '2d4f7e3f-3cb7-4e3e-9e7b-0ecf984f57a1';

async function seedGameState(page: Parameters<typeof test>[0]['page']) {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(
        async ({ dUsdId }) => {
            const state = {
                quests: {
                    'ubi/first-payment': { complete: true },
                },
                inventory: {
                    [dUsdId]: 50,
                },
                itemCounts: {},
                processes: {},
                settings: {},
                versionNumberString: '3',
                _meta: { lastUpdated: Date.now() },
            };

            await new Promise<void>((resolve, reject) => {
                const request = indexedDB.open('dspaceGameState');
                request.onupgradeneeded = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains('state')) {
                        db.createObjectStore('state');
                    }
                };
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    const db = request.result;
                    const tx = db.transaction('state', 'readwrite');
                    tx.objectStore('state').put(state, 'root');
                    tx.oncomplete = () => {
                        db.close();
                        resolve();
                    };
                    tx.onerror = () => reject(tx.error);
                };
            });
        },
        { dUsdId: DUSD_ID }
    );
}

async function readGameState(page: Parameters<typeof test>[0]['page']) {
    return page.evaluate(async () => {
        return await new Promise<Record<string, unknown>>((resolve, reject) => {
            const request = indexedDB.open('dspaceGameState');
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;
                const tx = db.transaction('state', 'readonly');
                const getReq = tx.objectStore('state').get('root');
                getReq.onsuccess = () => {
                    db.close();
                    resolve(getReq.result || {});
                };
                getReq.onerror = () => reject(getReq.error);
            };
        });
    });
}

async function runProcessByTitle(page: Parameters<typeof test>[0]['page'], title: string) {
    const card = page.locator('.container').filter({
        has: page.getByRole('heading', { name: title, exact: true }),
    });
    await expect(card).toBeVisible();

    await card.getByTestId('process-start-button').click();
    await expect(card.getByText('Collect')).toBeVisible();
    await card.getByText('Collect').click();
}

test.describe('savings jar item container flow', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
        await seedGameState(page);
    });

    test('tracks deposited dUSD in jar and returns all funds after break', async ({ page }) => {
        await page.goto('/quests/ubi/savings-goal');
        await waitForHydration(page);

        await page.getByText("I am in. Let's set this up.").click();

        await runProcessByTitle(page, 'buy sealed savings jar');

        let state = await readGameState(page);
        expect(state.inventory[SAVINGS_JAR_ID]).toBe(1);
        expect(state.inventory[DUSD_ID]).toBe(45);

        await page.getByText('I bought the jar.').click();
        await runProcessByTitle(page, 'stash dUSD in savings jar');

        state = await readGameState(page);
        expect(state.inventory[DUSD_ID]).toBe(35);
        expect(state.itemCounts[SAVINGS_JAR_ID][DUSD_ID]).toBe(10);

        await page.goto(`/inventory/item/${SAVINGS_JAR_ID}`);
        await waitForHydration(page);
        await expect(page.getByText('Stored items:')).toBeVisible();
        await expect(page.getByText('10')).toBeVisible();

        await page.goto('/quests/ubi/savings-goal');
        await waitForHydration(page);
        await page.getByText("I am in. Let's set this up.").click();
        await page.getByText('I bought the jar.').click();
        await page.getByText("I've stashed at least 10 dUSD.").click();

        await runProcessByTitle(page, 'break savings jar');

        state = await readGameState(page);
        expect(state.inventory[SAVINGS_JAR_ID] ?? 0).toBe(0);
        expect(state.inventory[BROKEN_JAR_ID]).toBe(1);
        expect(state.inventory[DUSD_ID]).toBe(45);
        expect(state.itemCounts[SAVINGS_JAR_ID][DUSD_ID]).toBe(0);
    });
});
