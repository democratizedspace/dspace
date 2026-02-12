import { beforeEach, describe, expect, it, vi } from 'vitest';
import items from '../src/pages/inventory/json/items';

vi.mock('../src/utils/gameState/common.js', () => {
    return {
        loadGameState: vi.fn(),
        saveGameState: vi.fn(),
    };
});

import { loadGameState, saveGameState } from '../src/utils/gameState/common.js';
import { getSalesTaxPercentage, sellItems } from '../src/utils/gameState/inventory.js';

const dUSDId = items.find((item) => item.name === 'dUSD')?.id;
const dCarbonId = items.find((item) => item.name === 'dCarbon')?.id;
const SELLABLE_ITEM_ID = 'sellable-item';

describe('gameState inventory dCarbon sales tax', () => {
    let mockGameState: {
        inventory: Record<string, number>;
    };

    beforeEach(() => {
        mockGameState = {
            inventory: {
                [SELLABLE_ITEM_ID]: 10,
                [dUSDId as string]: 50,
                [dCarbonId as string]: 0,
            },
        };

        vi.mocked(loadGameState).mockImplementation(() => mockGameState as never);
        vi.mocked(saveGameState).mockImplementation((newState) => {
            mockGameState = newState as typeof mockGameState;
        });

        vi.mocked(loadGameState).mockClear();
        vi.mocked(saveGameState).mockClear();
    });

    it('returns a continuous tax percentage based on dCarbon inventory', () => {
        mockGameState.inventory[dCarbonId as string] = 500;

        expect(getSalesTaxPercentage()).toBe(0.5);
    });

    it('caps the tax percentage at 90%', () => {
        mockGameState.inventory[dCarbonId as string] = 1_000_000;

        expect(getSalesTaxPercentage()).toBe(90);
    });

    it('applies continuous tax to item sales', () => {
        mockGameState.inventory[dCarbonId as string] = 2_000;

        sellItems([{ id: SELLABLE_ITEM_ID, quantity: 1, price: 10 }]);

        expect(mockGameState.inventory[SELLABLE_ITEM_ID]).toBe(9);
        expect(mockGameState.inventory[dUSDId as string]).toBeCloseTo(59.8, 5);
    });
});
