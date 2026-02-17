import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(),
    saveGameState: vi.fn(),
}));

import { loadGameState, saveGameState } from '../src/utils/gameState/common.js';
import {
    addStoredItems,
    canStoreItemInContainer,
    getStoredItemCount,
    getStoredItemCounts,
    removeAllStoredItems,
    removeStoredItems,
} from '../src/utils/gameState/itemContainers.js';

describe('itemContainers helpers', () => {
    let mockGameState;

    beforeEach(() => {
        mockGameState = {
            inventory: {},
            processes: {},
            itemContainerCounts: {},
        };

        vi.mocked(loadGameState).mockImplementation(() => mockGameState);
        vi.mocked(saveGameState).mockImplementation((newState) => {
            mockGameState = newState;
        });
    });

    test('supports deposit and withdrawal operations with non-negative balances', () => {
        const jarId = '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec';
        const dusdId = '5247a603-294a-4a34-a884-1ae20969b2a1';

        expect(canStoreItemInContainer(jarId, dusdId)).toBe(true);
        expect(getStoredItemCount(jarId, dusdId)).toBe(0);

        expect(addStoredItems(jarId, dusdId, 10)).toBe(true);
        expect(getStoredItemCount(jarId, dusdId)).toBe(10);

        expect(removeStoredItems(jarId, dusdId, 3)).toBe(3);
        expect(getStoredItemCount(jarId, dusdId)).toBe(7);

        expect(removeStoredItems(jarId, dusdId, 20)).toBe(7);
        expect(getStoredItemCount(jarId, dusdId)).toBe(0);

        expect(addStoredItems(jarId, dusdId, -1)).toBe(false);
        expect(removeStoredItems(jarId, dusdId, -1)).toBe(0);
    });

    test('rejects invalid container/item pairs and preserves default tracked keys', () => {
        const jarId = '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec';
        const dbiId = '016d4758-d114-4e04-9e6a-853db93a2eee';

        expect(canStoreItemInContainer(jarId, dbiId)).toBe(false);
        expect(addStoredItems(jarId, dbiId, 4)).toBe(false);
        expect(getStoredItemCount(jarId, dbiId)).toBe(0);

        const counts = getStoredItemCounts(jarId);
        expect(counts['5247a603-294a-4a34-a884-1ae20969b2a1']).toBe(0);

        expect(removeAllStoredItems(jarId, dbiId)).toBe(0);
    });
});
