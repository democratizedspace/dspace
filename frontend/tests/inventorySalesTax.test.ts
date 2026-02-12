import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(),
    saveGameState: vi.fn(),
}));

import { loadGameState, saveGameState } from '../src/utils/gameState/common.js';
import { getSalesTaxPercentage, sellItems } from '../src/utils/gameState/inventory.js';
import items from '../src/pages/inventory/json/items';

const dUSDId = items.find((i) => i.name === 'dUSD')?.id;
const dCarbonId = items.find((i) => i.name === 'dCarbon')?.id;

describe('inventory sales tax rules', () => {
    let mockGameState: { inventory: Record<string, number> };

    beforeEach(() => {
        mockGameState = {
            inventory: {
                sellable: 10,
                [dUSDId as string]: 50,
                [dCarbonId as string]: 0,
            },
        };

        vi.mocked(loadGameState).mockImplementation(() => mockGameState);
        vi.mocked(saveGameState).mockImplementation((nextState) => {
            mockGameState = nextState as { inventory: Record<string, number> };
        });
    });

    test('uses a continuous tax rate of dCarbon / 1000 percent', () => {
        mockGameState.inventory[dCarbonId as string] = 500;
        expect(getSalesTaxPercentage()).toBe(0.5);

        mockGameState.inventory[dCarbonId as string] = 2_000;
        expect(getSalesTaxPercentage()).toBe(2);
    });

    test('caps tax at 90%', () => {
        mockGameState.inventory[dCarbonId as string] = 1_000_000;
        expect(getSalesTaxPercentage()).toBe(90);
    });

    test('applies dCarbon tax once to sell proceeds for priced items', () => {
        mockGameState.inventory[dCarbonId as string] = 2_000;

        sellItems([{ id: 'sellable', quantity: 1, price: 10 }]);

        expect(mockGameState.inventory.sellable).toBe(9);
        expect(mockGameState.inventory[dUSDId as string]).toBe(59.8);
    });
});
