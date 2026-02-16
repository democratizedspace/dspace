import { expect, test } from '@playwright/test';
import { purgeClientState, waitForHydration } from './test-helpers';

const DUSD_ID = '5247a603-294a-4a34-a884-1ae20969b2a1';
const SAVINGS_JAR_ID = '66c2cdc6-9517-4c96-937f-1ddb4ee06ef3';
const BROKEN_JAR_ID = '6d4dfbe7-55c7-43bf-aba8-de7b05ff66a9';

test.describe('Savings jar mechanics', () => {
    function getProcessCard(page, title) {
        const heading = page.getByRole('heading', { name: title, exact: true });
        return heading.locator('xpath=..');
    }

    async function startAndCollectProcess(processCard) {
        await expect(processCard.getByRole('button', { name: 'Start' })).toBeVisible();
        await processCard.getByRole('button', { name: 'Start' }).first().click();
        await expect(processCard.getByRole('button', { name: 'Collect' })).toBeVisible({
            timeout: 15000,
        });
        await processCard.getByRole('button', { name: 'Collect' }).click();
    }

    async function readSavingsState(page) {
        return page.evaluate(
            ({ dUsdId, savingsJarId, brokenJarId }) => {
                const saved = JSON.parse(localStorage.getItem('gameState') || '{}');
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
        await page.goto('/');

        await page.evaluate(
            ({ dUsdId, savingsJarId }) => {
                const now = Date.now();
                const seededState = {
                    quests: {},
                    inventory: {
                        [dUsdId]: 25,
                        [savingsJarId]: 1,
                    },
                    inventoryItemCounts: {},
                    processes: {},
                    settings: {},
                    versionNumberString: '3',
                    _meta: { lastUpdated: now },
                };

                localStorage.setItem('gameState', JSON.stringify(seededState));
                localStorage.setItem('gameStateBackup', JSON.stringify(seededState));
            },
            { dUsdId: DUSD_ID, savingsJarId: SAVINGS_JAR_ID }
        );

        await page.goto('/processes/save-dusd-in-jar');
        await waitForHydration(page);
        await expect(
            page.getByRole('heading', {
                name: 'Deposit 10 dUSD into your savings jar',
                exact: true,
            })
        ).toBeVisible();

        const initialState = await readSavingsState(page);
        expect(initialState.stored).toBe(0);

        const depositProcess = getProcessCard(page, 'Deposit 10 dUSD into your savings jar');
        await depositProcess.getByTestId('process-deposit-amount-input').fill('10');
        await startAndCollectProcess(depositProcess);

        await expect
            .poll(async () => {
                const state = await readSavingsState(page);
                return state.stored;
            })
            .toBe(10);

        await page.goto('/processes/break-savings-jar');
        await waitForHydration(page);

        const breakProcess = getProcessCard(
            page,
            'Break your savings jar to retrieve all stored dUSD'
        );
        await startAndCollectProcess(breakProcess);

        const finalState = await readSavingsState(page);

        expect(finalState.dUsd).toBeCloseTo(25);
        expect(finalState.savingsJar).toBe(0);
        expect(finalState.brokenJar).toBe(1);
        expect(finalState.stored).toBe(0);
    });

    test('breaking an empty jar keeps dUSD unchanged and still creates broken jar', async ({
        page,
    }) => {
        await page.goto('/');

        await page.evaluate(
            ({ dUsdId, savingsJarId }) => {
                const now = Date.now();
                const seededState = {
                    quests: {},
                    inventory: {
                        [dUsdId]: 25,
                        [savingsJarId]: 1,
                    },
                    inventoryItemCounts: {
                        [savingsJarId]: {
                            [dUsdId]: 0,
                        },
                    },
                    processes: {},
                    settings: {},
                    versionNumberString: '3',
                    _meta: { lastUpdated: now },
                };

                localStorage.setItem('gameState', JSON.stringify(seededState));
                localStorage.setItem('gameStateBackup', JSON.stringify(seededState));
            },
            { dUsdId: DUSD_ID, savingsJarId: SAVINGS_JAR_ID }
        );

        await page.goto('/processes/break-savings-jar');
        await waitForHydration(page);

        const initialState = await readSavingsState(page);
        expect(initialState.stored).toBe(0);

        const breakProcess = getProcessCard(
            page,
            'Break your savings jar to retrieve all stored dUSD'
        );
        await startAndCollectProcess(breakProcess);

        const finalState = await readSavingsState(page);

        expect(finalState.dUsd).toBe(25);
        expect(finalState.savingsJar).toBe(0);
        expect(finalState.brokenJar).toBe(1);
        expect(finalState.stored).toBe(0);
    });
});
