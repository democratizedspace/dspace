import { beforeEach, describe, expect, test } from 'vitest';

import items from '../src/pages/inventory/json/items/index.js';
import {
    loadGameState,
    resetGameState,
    saveGameState,
    ready,
} from '../src/utils/gameState/common.js';
import { buyItems } from '../src/utils/gameState/inventory.js';

describe('game state cross-tab sync', () => {
    const dUSDId = items.find((item) => item.name === 'dUSD')?.id;
    const tradableItem = items.find((item) => {
        if (!item.id || item.name === 'dUSD') {
            return false;
        }

        if (typeof item.price !== 'string' || !item.price.includes('dUSD')) {
            return false;
        }

        const numericPrice = Number.parseFloat(item.price);
        return Number.isFinite(numericPrice) && numericPrice > 0;
    });

    beforeEach(async () => {
        await ready;
        await resetGameState();
    });

    test('loadGameState refreshes from newer localStorage checksum data', async () => {
        expect(dUSDId).toBeTruthy();
        expect(tradableItem?.id).toBeTruthy();

        const state = loadGameState();
        state.inventory[dUSDId!] = 5;
        state.inventory[tradableItem!.id] = 0;
        await saveGameState(state);

        const injectedState = {
            ...state,
            inventory: {
                ...state.inventory,
                [dUSDId!]: 77,
                [tradableItem!.id]: 9,
            },
            _meta: {
                lastUpdated: Date.now() + 1000,
                checksum: 'external-tab-checksum',
                dUSD: 77,
            },
        };

        localStorage.setItem('gameState', JSON.stringify(injectedState));
        localStorage.setItem(
            'gameStateSummary',
            JSON.stringify({
                lastUpdated: injectedState._meta.lastUpdated,
                checksum: injectedState._meta.checksum,
                dUSD: injectedState._meta.dUSD,
            })
        );

        const refreshed = loadGameState();
        expect(refreshed.inventory[dUSDId!]).toBe(77);
        expect(refreshed.inventory[tradableItem!.id]).toBe(9);
    });

    test('buyItems applies purchase on top of latest cross-tab localStorage state', async () => {
        expect(dUSDId).toBeTruthy();
        expect(tradableItem?.id).toBeTruthy();

        const price = Number.parseFloat(tradableItem!.price as string);

        const base = loadGameState();
        base.inventory[dUSDId!] = price * 3;
        base.inventory[tradableItem!.id] = 0;
        await saveGameState(base);

        const externalState = {
            ...base,
            inventory: {
                ...base.inventory,
                [dUSDId!]: price * 2,
                [tradableItem!.id]: 1,
            },
            _meta: {
                lastUpdated: Date.now() + 1000,
                checksum: 'external-tab-checksum-buy',
                dUSD: price * 2,
            },
        };

        localStorage.setItem('gameState', JSON.stringify(externalState));
        localStorage.setItem(
            'gameStateSummary',
            JSON.stringify({
                lastUpdated: externalState._meta.lastUpdated,
                checksum: externalState._meta.checksum,
                dUSD: externalState._meta.dUSD,
            })
        );

        await buyItems([{ id: tradableItem!.id, quantity: 1, price }]);

        const nextState = loadGameState();
        expect(nextState.inventory[tradableItem!.id]).toBe(2);
        expect(nextState.inventory[dUSDId!]).toBe(price);
    });
});
