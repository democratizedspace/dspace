import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../src/utils/gameState/common.js', () => {
    return {
        loadGameState: vi.fn(),
        saveGameState: vi.fn(),
    };
});

import items from '../src/pages/inventory/json/items';
import { loadGameState, saveGameState } from '../src/utils/gameState/common.js';
import { getSalesTaxPercentage, sellItems } from '../src/utils/gameState/inventory.js';

const dUSDId = items.find((item) => item.name === 'dUSD')?.id;
const dCarbonId = items.find((item) => item.name === 'dCarbon')?.id;
const sellableItemId = 'sellable-item';

describe('inventory sales tax', () => {
    let mockGameState: { inventory: Record<string, number> };

    beforeEach(() => {
        mockGameState = {
            inventory: {
                [sellableItemId]: 10,
                [dUSDId!]: 50,
                [dCarbonId!]: 0,
            },
        };

        vi.mocked(loadGameState).mockImplementation(() => mockGameState);
        vi.mocked(saveGameState).mockImplementation((newState) => {
            mockGameState = newState as { inventory: Record<string, number> };
        });
    });

    test('returns a fractional sales tax percentage for partial metric tons', () => {
        mockGameState.inventory[dCarbonId!] = 500;

        expect(getSalesTaxPercentage()).toBe(0.5);
    });

    test('applies the computed dCarbon tax once to sell proceeds', () => {
        mockGameState.inventory[dCarbonId!] = 2000;

        sellItems([{ id: sellableItemId, quantity: 1, price: 10 }]);

        expect(mockGameState.inventory[sellableItemId]).toBe(9);
        expect(mockGameState.inventory[dUSDId!]).toBeCloseTo(59.8);
    });

    test('caps sales tax at 90%', () => {
        mockGameState.inventory[dCarbonId!] = 1000000;

        sellItems([{ id: sellableItemId, quantity: 1, price: 10 }]);

        expect(getSalesTaxPercentage()).toBe(90);
        expect(mockGameState.inventory[dUSDId!]).toBeCloseTo(51);
    });
});
