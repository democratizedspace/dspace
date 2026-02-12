import { afterEach, describe, expect, test, vi } from 'vitest';

const dCarbonId = 'd88ef09c-9191-4c18-8628-a888bb9f926d';
const dUSDId = '5247a603-294a-4a34-a884-1ae20969b2a1';

const loadWithState = async (inventory: Record<string, number>) => {
    vi.resetModules();

    vi.doMock('../src/utils/gameState/common.js', () => {
        const gameState = { inventory: { ...inventory } };

        return {
            loadGameState: vi.fn(() => gameState),
            saveGameState: vi.fn((nextState: { inventory: Record<string, number> }) => {
                gameState.inventory = { ...nextState.inventory };
            }),
        };
    });

    const inventoryModule = await import('../src/utils/gameState/inventory.js');
    const commonModule = await import('../src/utils/gameState/common.js');

    return {
        ...inventoryModule,
        loadGameState: commonModule.loadGameState as unknown as () => {
            inventory: Record<string, number>;
        },
    };
};

afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
});

describe('dCarbon sales tax behavior', () => {
    test('computes continuous tax rate from dCarbon', async () => {
        const { getSalesTaxPercentage } = await loadWithState({ [dCarbonId]: 500 });

        expect(getSalesTaxPercentage()).toBe(0.5);
    });

    test('caps tax rate at 90%', async () => {
        const { getSalesTaxPercentage } = await loadWithState({ [dCarbonId]: 1_000_000 });

        expect(getSalesTaxPercentage()).toBe(90);
    });

    test('applies continuous tax when selling items', async () => {
        const { sellItems, loadGameState } = await loadWithState({
            [dCarbonId]: 500,
            [dUSDId]: 50,
            demo: 1,
        });

        sellItems([{ id: 'demo', quantity: 1, price: 10 }]);

        expect(loadGameState().inventory[dUSDId]).toBeCloseTo(59.95, 10);
    });

    test('applies 2% tax at 2000 dCarbon and preserves the cap example', async () => {
        const highTax = await loadWithState({
            [dCarbonId]: 2_000,
            [dUSDId]: 50,
            demo: 1,
        });
        highTax.sellItems([{ id: 'demo', quantity: 1, price: 10 }]);
        expect(highTax.loadGameState().inventory[dUSDId]).toBe(59.8);

        const cappedTax = await loadWithState({
            [dCarbonId]: 1_000_000,
            [dUSDId]: 50,
            demo: 1,
        });
        cappedTax.sellItems([{ id: 'demo', quantity: 1, price: 10 }]);
        expect(cappedTax.loadGameState().inventory[dUSDId]).toBe(51);
    });
});
