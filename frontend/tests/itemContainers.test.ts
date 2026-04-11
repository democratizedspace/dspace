import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../src/utils/gameState/common.js', () => {
    return {
        loadGameState: vi.fn(),
        saveGameState: vi.fn().mockResolvedValue(undefined),
    };
});

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
    let mockGameState: {
        inventory: Record<string, number>;
        itemContainerCounts: Record<string, Record<string, number>>;
        processes: Record<string, unknown>;
    };

    const jarId = '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec';
    const dusdId = '5247a603-294a-4a34-a884-1ae20969b2a1';

    beforeEach(() => {
        mockGameState = {
            inventory: {},
            itemContainerCounts: {},
            processes: {},
        };

        vi.mocked(loadGameState).mockImplementation(() => mockGameState);
        vi.mocked(saveGameState).mockImplementation((nextState: typeof mockGameState) => {
            mockGameState = nextState;
            return Promise.resolve();
        });
    });

    test('supports deposits and withdrawals while keeping counts non-negative', () => {
        expect(addStoredItems(jarId, dusdId, 10)).toBe(true);
        expect(getStoredItemCount(jarId, dusdId)).toBe(10);

        expect(removeStoredItems(jarId, dusdId, 3)).toBe(3);
        expect(getStoredItemCount(jarId, dusdId)).toBe(7);

        expect(removeStoredItems(jarId, dusdId, 20)).toBe(7);
        expect(getStoredItemCount(jarId, dusdId)).toBe(0);
    });

    test('rejects invalid container-item pairs and invalid counts', () => {
        expect(canStoreItemInContainer('', dusdId)).toBe(false);
        expect(canStoreItemInContainer(jarId, '')).toBe(false);
        expect(canStoreItemInContainer('missing-container', dusdId)).toBe(false);
        expect(canStoreItemInContainer(jarId, 'invalid-item')).toBe(false);
        expect(addStoredItems(jarId, 'invalid-item', 5)).toBe(false);
        expect(addStoredItems(jarId, dusdId, -1)).toBe(false);
        expect(addStoredItems(jarId, dusdId, 0)).toBe(false);

        expect(getStoredItemCount(jarId, 'invalid-item')).toBe(0);
        expect(removeStoredItems(jarId, 'invalid-item', 1)).toBe(0);
        expect(removeStoredItems(jarId, dusdId, 0)).toBe(0);
        expect(removeStoredItems(jarId, dusdId, -1)).toBe(0);
        expect(removeAllStoredItems(jarId, 'invalid-item')).toBe(0);
    });

    test('returns tracked defaults and supports remove-all', () => {
        expect(getStoredItemCounts(jarId)).toEqual({ [dusdId]: 0 });
        expect(getStoredItemCounts('missing-container')).toEqual({});

        mockGameState.itemContainerCounts[jarId] = {};
        expect(getStoredItemCounts(jarId)).toEqual({ [dusdId]: 0 });

        addStoredItems(jarId, dusdId, 12.5);
        expect(removeAllStoredItems(jarId, dusdId)).toBe(12.5);
        expect(getStoredItemCount(jarId, dusdId)).toBe(0);
        expect(removeAllStoredItems(jarId, dusdId)).toBe(0);
    });


    test('normalizes malformed persisted counts to non-negative finite values', () => {
        mockGameState.itemContainerCounts[jarId] = {
            [dusdId]: Number.NaN,
        };
        expect(getStoredItemCounts(jarId)).toEqual({ [dusdId]: 0 });

        mockGameState.itemContainerCounts[jarId] = {
            [dusdId]: -3,
        };
        expect(getStoredItemCounts(jarId)).toEqual({ [dusdId]: 0 });

        mockGameState.itemContainerCounts[jarId] = {
            [dusdId]: Infinity,
        };
        expect(getStoredItemCounts(jarId)).toEqual({ [dusdId]: 0 });
    });

    test('does not expose invalid stored item ids from persisted state', () => {
        mockGameState.itemContainerCounts[jarId] = {
            [dusdId]: 4,
            'unexpected-item-id': 10,
        };

        expect(getStoredItemCounts(jarId)).toEqual({ [dusdId]: 4 });
    });
});
