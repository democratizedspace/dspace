import { vi } from 'vitest';

vi.mock('../../src/utils/gameState/common.js', () => {
    return {
        loadGameState: vi.fn(),
        saveGameState: vi.fn().mockResolvedValue(true),
    };
});

import {
    addItems,
    burnItems,
    getItemCounts,
    getItemCount,
    getCurrentdUSD,
    buyItems,
    sellItems,
    hasItems,
    getSalesTaxPercentage,
} from '../../src/utils/gameState/inventory.js';
import items from '../../src/pages/inventory/json/items';

const dUSDId = items.find((i) => i.name === 'dUSD').id;
const dCarbonId = items.find((i) => i.name === 'dCarbon').id;
const ITEM1 = 'item-1';
const ITEM2 = 'item-2';

import { loadGameState, saveGameState } from '../../src/utils/gameState/common.js';

describe('gameState - inventory', () => {
    let mockGameState;

    beforeEach(() => {
        mockGameState = {
            inventory: {
                [ITEM1]: 10,
                [dUSDId]: 50,
                [dCarbonId]: 0,
            },
        };

        loadGameState.mockImplementation(() => mockGameState);
        saveGameState.mockImplementation((newState) => {
            mockGameState = newState;
            return true;
        });

        loadGameState.mockClear();
        saveGameState.mockClear();
    });

    test('addItems should correctly add items to the inventory', () => {
        const itemsToAdd = [
            { id: '1', count: 5 },
            { id: '2', count: 3 },
        ];

        addItems(itemsToAdd);

        const expectedInventory = {
            1: 15, // The count of item "1" should have increased by 5
            2: 3, // The count of new item "2" should be 3
            [dUSDId]: 50, // The counts of other items should not change
            [dCarbonId]: 0,
        };

        expect(mockGameState.inventory).toEqual(expectedInventory);
    });

    test('burnItems should correctly burn items from the inventory', () => {
        const itemsToBurn = [{ id: '1', count: 5 }];

        burnItems(itemsToBurn);

        const expectedInventory = {
            1: 5, // The count of item "1" should have decreased by 5
            [dUSDId]: 50, // The counts of other items should not change
            [dCarbonId]: 0,
        };

        expect(mockGameState.inventory).toEqual(expectedInventory);
    });

    test('burnItems should not burn items when not enough are available', () => {
        const itemsToBurn = [{ id: '1', count: 15 }];

        burnItems(itemsToBurn);

        const expectedInventory = {
            1: 10, // The count of item "1" should remain the same as burning more than available was attempted
            [dUSDId]: 50, // The counts of other items should not change
            [dCarbonId]: 0,
        };

        expect(mockGameState.inventory).toEqual(expectedInventory);
    });

    test('getItemCounts should correctly return counts of items', () => {
        const items = [{ id: '1' }, { id: '2' }];

        const counts = getItemCounts(items);

        const expectedCounts = {
            1: 10, // The count of item "1" should be 10
            2: 0, // The count of item "2" should be 0 since it doesn't exist in the inventory
        };

        expect(counts).toEqual(expectedCounts);
    });

    test('getItemCount should correctly return the count of a specific item', () => {
        const count = getItemCount('1');

        expect(count).toBe(10);
    });

    test('getCurrentdUSD should correctly return the count of dUSD', () => {
        const count = getCurrentdUSD();

        expect(count).toBe(50);
    });

    test('buyItems should correctly deduct the cost from dUSD and add items to the inventory', () => {
        const itemsToBuy = [{ id: '1', quantity: 2, price: 5 }];

        buyItems(itemsToBuy);

        const expectedInventory = {
            1: 12, // The count of item "1" should have increased by 2
            [dUSDId]: 40, // The count of dUSD should have decreased by 10 (2 items * price 5)
            [dCarbonId]: 0,
        };

        expect(mockGameState.inventory).toEqual(expectedInventory);
    });

    test('buyItems should not buy items when not enough dUSD is available', () => {
        const itemsToBuy = [{ id: '1', quantity: 2, price: 30 }];

        buyItems(itemsToBuy);

        const expectedInventory = {
            1: 10, // The count of item "1" should remain the same as buying more than available was attempted
            [dUSDId]: 50, // The count of dUSD should not change
            [dCarbonId]: 0,
        };

        expect(mockGameState.inventory).toEqual(expectedInventory);
    });

    test('buyItems count should equal inventory count if there were no previous items', () => {
        const itemsToBuy = [{ id: '1', quantity: 2, price: 5 }];

        buyItems(itemsToBuy);

        const expectedInventory = {
            1: 12, // The count of item "1" should have increased by 2
            [dUSDId]: 40, // The count of dUSD should have decreased by 10 (2 items * price 5)
            [dCarbonId]: 0,
        };

        expect(mockGameState.inventory).toEqual(expectedInventory);
    });

    test('buyItems count should add to inventory count if there were previous items', () => {
        const itemsToBuy = [{ id: '1', quantity: 2, price: 5 }];

        buyItems(itemsToBuy);

        const expectedInventory = {
            1: 12, // The count of item "1" should have increased by 2
            [dUSDId]: 40, // The count of dUSD should have decreased by 10 (2 items * price 5)
            [dCarbonId]: 0,
        };

        expect(mockGameState.inventory).toEqual(expectedInventory);
    });

    test('hasItems should correctly check if the inventory has enough of each item', () => {
        const items = [
            { id: '1', count: 5 },
            { id: '2', count: 1 },
        ];

        const result = hasItems(items);

        expect(result).toBe(false); // The function should return false since the inventory doesn't have enough of item "2"
    });

    test('hasItems should return true if the inventory has enough of each item', () => {
        const items = [
            { id: ITEM1, count: 5 },
            { id: dUSDId, count: 10 },
        ];

        const result = hasItems(items);

        expect(result).toBe(true); // The function should return true since the inventory has enough of each item
    });

    test('sellItems should silently fail if trying to sell more items than available', () => {
        const itemsToSell = [{ id: '1', quantity: 15, price: 5 }];

        sellItems(itemsToSell);

        const expectedInventory = {
            1: 10, // The count of item "1" should remain the same since we tried to sell more than we have
            [dUSDId]: 50, // The count of dUSD should not change since no items were sold
            [dCarbonId]: 0,
        };

        expect(mockGameState.inventory).toEqual(expectedInventory);
    });

    test('sellItems should correctly sell items if the quantity to sell is less than or equal to the actual count', () => {
        const itemsToSell = [{ id: '1', quantity: 5, price: 5 }];

        sellItems(itemsToSell);

        const expectedInventory = {
            1: 5, // The count of item "1" should have decreased by 5
            [dUSDId]: 75, // The count of dUSD should have increased by 25 (5 items * price 5) considering there's no tax
            [dCarbonId]: 0,
        };

        expect(mockGameState.inventory).toEqual(expectedInventory);
    });

    test('sellItems should correctly increase dUSD after selling items', () => {
        const itemsToSell = [{ id: '1', quantity: 5, price: 5 }];

        sellItems(itemsToSell);

        const expectedInventory = {
            1: 5, // The count of item "1" should have decreased by 5
            [dUSDId]: 75, // The count of dUSD should have increased by 25 (5 items * price 5) considering there's no tax
            [dCarbonId]: 0,
        };

        expect(mockGameState.inventory).toEqual(expectedInventory);
        expect(mockGameState.inventory[dUSDId]).toBe(75); // dUSD should have increased correctly
    });

    test('sellItems should reject items with negative price', () => {
        const itemsToSell = [{ id: '1', quantity: 5, price: -5 }];

        sellItems(itemsToSell);

        const expectedInventory = {
            1: 10, // The count of item "1" should remain the same since the price was negative
            [dUSDId]: 50, // The count of dUSD should not change since no items were sold
            [dCarbonId]: 0,
        };

        expect(mockGameState.inventory).toEqual(expectedInventory);
    });

    test('sellItems should reject items with a price of zero', () => {
        const itemsToSell = [{ id: '1', quantity: 5, price: 0 }];

        sellItems(itemsToSell);

        const expectedInventory = {
            1: 10, // The count of item "1" should remain the same since the price was negative
            [dUSDId]: 50, // The count of dUSD should not change since no items were sold
            [dCarbonId]: 0,
        };

        expect(mockGameState.inventory).toEqual(expectedInventory);
    });

    test('sellItems should reject items with an undefined price', () => {
        const itemsToSell = [{ id: '1', quantity: 5 }];

        sellItems(itemsToSell);

        const expectedInventory = {
            1: 10, // The count of item "1" should remain the same since the price was negative
            [dUSDId]: 50, // The count of dUSD should not change since no items were sold
            [dCarbonId]: 0,
        };

        expect(mockGameState.inventory).toEqual(expectedInventory);
    });

    test('sellItems should reject items with negative count', () => {
        const itemsToSell = [{ id: '1', quantity: -5, price: 5 }];

        sellItems(itemsToSell);

        const expectedInventory = {
            1: 10, // The count of item "1" should remain the same since the count was negative
            [dUSDId]: 50, // The count of dUSD should not change since no items were sold
            [dCarbonId]: 0,
        };

        expect(mockGameState.inventory).toEqual(expectedInventory);
    });

    test('getSalesTaxPercentage should return 0% if there is no dCarbon', () => {
        expect(getSalesTaxPercentage()).toBe(0);
    });

    test('getSalesTaxPercentage should return 10% for 1000 dCarbon', () => {
        mockGameState.inventory[dCarbonId] = 1000;
        expect(getSalesTaxPercentage()).toBe(10);
    });

    test('getSalesTaxPercentage should return 20% for 2000 dCarbon', () => {
        mockGameState.inventory[dCarbonId] = 2000;
        expect(getSalesTaxPercentage()).toBe(20);
    });

    test('getSalesTaxPercentage should return 90% for 9000 dCarbon', () => {
        mockGameState.inventory[dCarbonId] = 9000;
        expect(getSalesTaxPercentage()).toBe(90);
    });

    test('getSalesTaxPercentage should cap at 90% for values greater than 9000 dCarbon', () => {
        mockGameState.inventory[dCarbonId] = 9500;
        expect(getSalesTaxPercentage()).toBe(90);
    });
});
