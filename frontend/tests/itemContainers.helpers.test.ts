import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(),
    saveGameState: vi.fn(),
}));

import {
    addStoredItems,
    canStoreItemInContainer,
    getStoredItemCount,
    getStoredItemCounts,
    removeAllStoredItems,
    removeStoredItems,
} from '../src/utils/gameState/itemContainers.js';
import { loadGameState, saveGameState } from '../src/utils/gameState/common.js';

describe('itemContainers helpers', () => {
    let mockState: { itemContainerCounts: Record<string, Record<string, number>> };
    const jarId = '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec';
    const dusdId = '5247a603-294a-4a34-a884-1ae20969b2a1';

    beforeEach(() => {
        mockState = { itemContainerCounts: {} };
        vi.mocked(loadGameState).mockImplementation(() => mockState as never);
        vi.mocked(saveGameState).mockImplementation((nextState) => {
            mockState = nextState as never;
        });
    });

    test('allows configured container pairs and defaults to zero', () => {
        expect(canStoreItemInContainer(jarId, dusdId)).toBe(true);
        expect(getStoredItemCount(jarId, dusdId)).toBe(0);
        expect(getStoredItemCounts(jarId)).toEqual({ [dusdId]: 0 });
    });

    test('add/remove keeps balances non-negative and rejects invalid pairs', () => {
        expect(addStoredItems(jarId, dusdId, 10)).toBe(true);
        expect(getStoredItemCount(jarId, dusdId)).toBe(10);

        expect(removeStoredItems(jarId, dusdId, 4)).toBe(4);
        expect(getStoredItemCount(jarId, dusdId)).toBe(6);

        expect(removeStoredItems(jarId, dusdId, 99)).toBe(6);
        expect(getStoredItemCount(jarId, dusdId)).toBe(0);

        expect(addStoredItems(jarId, 'not-allowed', 10)).toBe(false);
        expect(removeAllStoredItems(jarId, 'not-allowed')).toBe(0);
        expect(getStoredItemCount(jarId, 'not-allowed')).toBe(0);
    });
});
