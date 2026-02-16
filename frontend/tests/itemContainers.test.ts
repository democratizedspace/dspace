import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
    addStoredItems,
    canStoreItemInContainer,
    getStoredItemCount,
    removeAllStoredItems,
    removeStoredItems,
} from '../src/utils/gameState/itemContainers.js';

const loadGameStateMock = vi.hoisted(() => vi.fn());
const saveGameStateMock = vi.hoisted(() => vi.fn());

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: (...args: unknown[]) => loadGameStateMock(...args),
    saveGameState: (...args: unknown[]) => saveGameStateMock(...args),
}));

describe('item container state helpers', () => {
    type GameState = {
        inventory: Record<string, number>;
        inventoryItemCounts: Record<string, Record<string, number>>;
    };

    let gameState: GameState;

    beforeEach(() => {
        gameState = {
            inventory: {},
            inventoryItemCounts: {},
        };

        loadGameStateMock.mockImplementation(() => gameState);
        saveGameStateMock.mockImplementation((incoming: GameState) => {
            gameState = incoming;
        });
    });

    test('supports savings jar dUSD compatibility mapping', () => {
        expect(
            canStoreItemInContainer(
                '66c2cdc6-9517-4c96-937f-1ddb4ee06ef3',
                '5247a603-294a-4a34-a884-1ae20969b2a1'
            )
        ).toBe(true);
        expect(
            canStoreItemInContainer(
                '66c2cdc6-9517-4c96-937f-1ddb4ee06ef3',
                'd88ef09c-9191-4c18-8628-a888bb9f926d'
            )
        ).toBe(false);
    });

    test('tracks deposits and withdrawals for allowed container/item pairs', () => {
        const jarId = '66c2cdc6-9517-4c96-937f-1ddb4ee06ef3';
        const dUsdId = '5247a603-294a-4a34-a884-1ae20969b2a1';

        expect(getStoredItemCount(jarId, dUsdId)).toBe(0);

        expect(addStoredItems(jarId, dUsdId, 12.5)).toBe(true);
        expect(getStoredItemCount(jarId, dUsdId)).toBeCloseTo(12.5);

        expect(removeStoredItems(jarId, dUsdId, 4.25)).toBeCloseTo(4.25);
        expect(getStoredItemCount(jarId, dUsdId)).toBeCloseTo(8.25);

        expect(removeAllStoredItems(jarId, dUsdId)).toBeCloseTo(8.25);
        expect(getStoredItemCount(jarId, dUsdId)).toBe(0);
    });

    test('rejects unsupported container operations', () => {
        const jarId = '66c2cdc6-9517-4c96-937f-1ddb4ee06ef3';
        const dCarbonId = 'd88ef09c-9191-4c18-8628-a888bb9f926d';

        expect(addStoredItems(jarId, dCarbonId, 1)).toBe(false);
        expect(removeStoredItems(jarId, dCarbonId, 1)).toBe(0);
    });
});
