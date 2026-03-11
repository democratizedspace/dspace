import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../frontend/src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(),
    saveGameState: vi.fn(),
    getGameStateChecksum: vi.fn(() => ''),
    syncGameStateFromLocalIfStale: vi.fn(),
}));

import { buyItems } from '../frontend/src/utils/gameState/inventory.js';
import items from '../frontend/src/pages/inventory/json/items';
import {
    loadGameState,
    saveGameState,
} from '../frontend/src/utils/gameState/common.js';

const dUSDId = (items as Array<{ id: string; name: string }>).find((item) => item.name === 'dUSD')?.id;

describe('buyItems guardrails', () => {
    beforeEach(() => {
        vi.mocked(loadGameState).mockReturnValue({
            inventory: {
                [dUSDId as string]: 20,
            },
        });
        vi.mocked(saveGameState).mockClear();
    });

    test('does not grant items when price is zero or invalid', () => {
        buyItems([
            { id: 'demo-item', quantity: 2, price: 0 },
            { id: 'another-item', quantity: 1, price: -4 },
            { id: 'third-item', quantity: 0, price: 3 },
        ]);

        const savedState = vi.mocked(saveGameState).mock.calls.at(-1)?.[0] as {
            inventory: Record<string, number>;
        };

        expect(savedState.inventory[dUSDId as string]).toBe(20);
        expect(savedState.inventory['demo-item']).toBeUndefined();
        expect(savedState.inventory['another-item']).toBeUndefined();
        expect(savedState.inventory['third-item']).toBeUndefined();
    });

    test('still buys items with a valid positive price and quantity', () => {
        buyItems([{ id: 'paid-item', quantity: 2, price: 5 }]);

        const savedState = vi.mocked(saveGameState).mock.calls.at(-1)?.[0] as {
            inventory: Record<string, number>;
        };

        expect(savedState.inventory[dUSDId as string]).toBe(10);
        expect(savedState.inventory['paid-item']).toBe(2);
    });
});
