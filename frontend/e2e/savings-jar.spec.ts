import { expect, test } from '@playwright/test';
import { purgeClientState, waitForHydration } from './test-helpers';

const dUSDId = '5247a603-294a-4a34-a884-1ae20969b2a1';
const jarId = 'cc89cbc9-7d07-4dbb-a8ea-0ba34951c080';
const brokenJarId = 'dc2626d8-4bec-4105-bfbe-625fd045250b';

test.describe('savings jar quest mechanics', () => {
    test.beforeEach(async ({ page }) => {
        await purgeClientState(page);

        await page.evaluate(() => {
            localStorage.setItem(
                'gameState',
                JSON.stringify({
                    quests: { 'ubi/first-payment': { finished: true } },
                    inventory: { '5247a603-294a-4a34-a884-1ae20969b2a1': 50 },
                    processes: {},
                    settings: {},
                    versionNumberString: '3',
                    _meta: { lastUpdated: Date.now() },
                })
            );
        });
    });

    test('tracks dUSD stored in jar and releases it when broken', async ({ page }) => {
        await page.goto(`/inventory/item/${jarId}`);
        await waitForHydration(page);
        await page.getByRole('button', { name: /buy for 5 dUSD/i }).click();

        await page.goto('/quests/ubi/savings-goal');
        await waitForHydration(page);

        const depositCard = page.locator('.container').filter({
            has: page.getByRole('heading', { name: /Deposit 10 dUSD into sealed savings jar/i }),
        });

        await depositCard.getByTestId('process-start-button').click();
        await depositCard.getByRole('button', { name: 'Collect' }).click();

        const afterDeposit = await page.evaluate(
            ([dUSDItemId, savingsJarItemId]) => {
                const state = JSON.parse(localStorage.getItem('gameState') || '{}');
                return {
                    dUSD: state.inventory?.[dUSDItemId],
                    jar: state.inventory?.[savingsJarItemId],
                };
            },
            [dUSDId, jarId]
        );

        expect(afterDeposit.dUSD).toBe(35);
        expect(afterDeposit.jar.itemCounts[dUSDId]).toBe(10);

        await page.getByRole('button', { name: /Continue to the withdrawal drill/i }).click();

        const breakCard = page.locator('.container').filter({
            has: page.getByRole('heading', {
                name: /Break sealed savings jar and recover savings/i,
            }),
        });

        await breakCard.getByTestId('process-start-button').click();
        await breakCard.getByRole('button', { name: 'Collect' }).click();

        const afterBreak = await page.evaluate(
            ([dUSDItemId, savingsJarItemId, brokenSavingsJarItemId]) => {
                const state = JSON.parse(localStorage.getItem('gameState') || '{}');
                return {
                    dUSD: state.inventory?.[dUSDItemId],
                    jar: state.inventory?.[savingsJarItemId],
                    brokenJar: state.inventory?.[brokenSavingsJarItemId],
                };
            },
            [dUSDId, jarId, brokenJarId]
        );

        expect(afterBreak.dUSD).toBe(45);
        expect(afterBreak.jar.count).toBe(0);
        expect(afterBreak.jar.itemCounts[dUSDId]).toBe(0);
        expect(afterBreak.brokenJar).toBe(1);
    });
});
