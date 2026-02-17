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

describe('item container helpers', () => {
    let gameState: Record<string, unknown>;

    beforeEach(() => {
        gameState = {
            inventory: {},
            itemContainerCounts: {},
            processes: {},
            quests: {},
            settings: {},
        };

        vi.mocked(loadGameState).mockImplementation(() => gameState as never);
        vi.mocked(saveGameState).mockImplementation((nextState) => {
            gameState = nextState as never;
        });
    });

    test('supports valid savings jar container/item pair with default runtime 0', () => {
        expect(
            canStoreItemInContainer(
                '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec',
                '5247a603-294a-4a34-a884-1ae20969b2a1'
            )
        ).toBe(true);
        expect(
            getStoredItemCount(
                '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec',
                '5247a603-294a-4a34-a884-1ae20969b2a1'
            )
        ).toBe(0);

        const counts = getStoredItemCounts('830d74da-9de5-44c7-8b9f-83a1ed3aa8ec');
        expect(counts).toEqual({ '5247a603-294a-4a34-a884-1ae20969b2a1': 0 });
    });

    test('rejects invalid container/item pairs and prevents negative math', () => {
        expect(addStoredItems('830d74da-9de5-44c7-8b9f-83a1ed3aa8ec', 'dne', 4)).toBe(false);
        expect(removeStoredItems('830d74da-9de5-44c7-8b9f-83a1ed3aa8ec', 'dne', 4)).toBe(0);

        addStoredItems(
            '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec',
            '5247a603-294a-4a34-a884-1ae20969b2a1',
            3
        );
        expect(
            removeStoredItems(
                '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec',
                '5247a603-294a-4a34-a884-1ae20969b2a1',
                10
            )
        ).toBe(3);
        expect(
            getStoredItemCount(
                '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec',
                '5247a603-294a-4a34-a884-1ae20969b2a1'
            )
        ).toBe(0);
    });

    test('removeAllStoredItems clears and returns prior value', () => {
        addStoredItems(
            '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec',
            '5247a603-294a-4a34-a884-1ae20969b2a1',
            12.5
        );

        const removed = removeAllStoredItems(
            '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec',
            '5247a603-294a-4a34-a884-1ae20969b2a1'
        );

        expect(removed).toBe(12.5);
        expect(
            getStoredItemCount(
                '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec',
                '5247a603-294a-4a34-a884-1ae20969b2a1'
            )
        ).toBe(0);
    });
});
