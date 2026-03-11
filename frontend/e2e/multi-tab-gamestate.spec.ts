import { expect, test } from '@playwright/test';

const ITEM_ID = '83fe7eee-135e-4885-9ce0-9042b9fb860a';
const DUSD_ID = '5247a603-294a-4a34-a884-1ae20969b2a1';

const seedScript = {
    gameState: {
        quests: {},
        inventory: {
            [DUSD_ID]: 500,
            [ITEM_ID]: 0,
        },
        processes: {},
        itemContainerCounts: {},
        settings: {
            showChatDebugPayload: false,
            showQuestGraphVisualizer: false,
        },
        versionNumberString: '3',
        _meta: {
            lastUpdated: Date.now(),
            checksum: 'seed-checksum',
        },
    },
};

test.describe('multi-tab game state writes', () => {
    test('buying from two tabs merges both purchases', async ({ context }) => {
        await context.addInitScript((seed) => {
            localStorage.setItem('gameState', JSON.stringify(seed.gameState));
            localStorage.setItem('gameStateChecksum', seed.gameState._meta.checksum);
        }, seedScript);

        const firstTab = await context.newPage();
        const secondTab = await context.newPage();

        await firstTab.goto(`/inventory/item/${ITEM_ID}`);
        await secondTab.goto(`/inventory/item/${ITEM_ID}`);

        await firstTab.getByTestId('transaction-cta').click();
        await firstTab.close();

        await secondTab.getByTestId('transaction-cta').click();

        const finalState = await secondTab.evaluate(() =>
            JSON.parse(localStorage.getItem('gameState') || '{}')
        );

        expect(finalState.inventory[ITEM_ID]).toBe(2);
        expect(finalState.inventory[DUSD_ID]).toBe(260);
    });
});
