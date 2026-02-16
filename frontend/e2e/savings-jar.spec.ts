import { expect, test } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const DUSD_ID = '5247a603-294a-4a34-a884-1ae20969b2a1';
const SAVINGS_JAR_ID = 'b7046e45-1cce-4cb8-9a23-6045c74cd667';
const BROKEN_JAR_ID = '5139e813-8097-4325-9581-545775a633ad';

test.describe('savings jar container flow', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);

        await page.goto('/');
        await page.evaluate(() => {
            const state = {
                quests: {
                    'ubi/first-payment': { finished: true },
                },
                inventory: {
                    '5247a603-294a-4a34-a884-1ae20969b2a1': 50,
                },
                itemContainerCounts: {},
                processes: {},
                settings: {},
                versionNumberString: '3',
                _meta: { lastUpdated: Date.now() },
            };

            localStorage.setItem('gameState', JSON.stringify(state));
            localStorage.setItem('gameStateBackup', JSON.stringify(state));
        });
    });

    test('buys, deposits, tracks container amount, then breaks jar to withdraw', async ({
        page,
    }) => {
        await page.goto('/quests/ubi/savings-goal');
        await waitForHydration(page, 'data-testid=chat-panel');

        const buyCard = page.locator('.container').filter({ hasText: 'Buy a sealed savings jar' });
        await buyCard.getByRole('button', { name: 'Start' }).click();
        await buyCard.getByRole('button', { name: 'Collect' }).click();

        await page.getByRole('button', { name: 'I already have a jar.' }).click();

        const depositCard = page
            .locator('.container')
            .filter({ hasText: 'Deposit 10 dUSD into the sealed savings jar' });
        await depositCard.getByRole('button', { name: 'Start' }).click();
        await depositCard.getByRole('button', { name: 'Collect' }).click();

        const postDepositState = await page.evaluate(() =>
            JSON.parse(localStorage.getItem('gameState') || '{}')
        );
        expect(postDepositState.itemContainerCounts[SAVINGS_JAR_ID][DUSD_ID]).toBe(10);
        expect(postDepositState.inventory[DUSD_ID]).toBe(28);

        await page
            .getByRole('button', { name: "I've already deposited at least 10 dUSD." })
            .click();
        await page.getByRole('button', { name: 'Savings jar started.' }).click();
        await expect(page.getByText('Quest Complete!')).toBeVisible();

        await page.goto(`/inventory/item/${SAVINGS_JAR_ID}`);
        await waitForHydration(page);
        await expect(page.getByText('Stored in this container:')).toBeVisible();
        await expect(page.getByText(/dUSD/i)).toBeVisible();
        await expect(page.getByText(/10/)).toBeVisible();

        const breakCard = page
            .locator('.container')
            .filter({ hasText: 'Break the savings jar and recover all stored dUSD' });
        await breakCard.getByRole('button', { name: 'Start' }).click();
        await breakCard.getByRole('button', { name: 'Collect' }).click();

        const finalState = await page.evaluate(() =>
            JSON.parse(localStorage.getItem('gameState') || '{}')
        );
        expect(finalState.itemContainerCounts[SAVINGS_JAR_ID][DUSD_ID]).toBe(0);
        expect(finalState.inventory[DUSD_ID]).toBe(38);
        expect(finalState.inventory[SAVINGS_JAR_ID]).toBe(0);
        expect(finalState.inventory[BROKEN_JAR_ID]).toBe(1);
    });
});
