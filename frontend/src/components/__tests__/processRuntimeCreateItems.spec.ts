import { vi, describe, test, expect, beforeEach } from 'vitest';

const getStoredItemCountMock = vi.hoisted(() => vi.fn());

vi.mock('../../utils/gameState/itemContainers.js', () => ({
    canStoreItemInContainer: vi.fn(() => true),
    getStoredItemCount: (...args: unknown[]) => getStoredItemCountMock(...args),
    addStoredItemsToState: vi.fn(),
    removeStoredItemsFromState: vi.fn(),
    removeAllStoredItemsFromState: vi.fn(),
}));

vi.mock('../../generated/processes.json', () => ({
    default: [
        {
            id: 'runtime-create',
            createItems: [{ id: 'broken-jar', count: 1 }],
            itemCountOperations: [
                {
                    operation: 'withdraw-all',
                    containerItemId: 'jar',
                    itemId: 'dusd',
                },
            ],
        },
    ],
}));

import { getRuntimeCreateItems } from '../../utils/gameState/processes.js';

describe('getRuntimeCreateItems', () => {
    beforeEach(() => {
        getStoredItemCountMock.mockReset();
    });

    test('includes withdraw-all item counts alongside static create items', () => {
        getStoredItemCountMock.mockReturnValue(37);

        expect(getRuntimeCreateItems('runtime-create')).toEqual([
            { id: 'broken-jar', count: 1 },
            { id: 'dusd', count: 37 },
        ]);
    });

    test('merges duplicate created items by id', () => {
        getStoredItemCountMock.mockReturnValue(2);

        expect(
            getRuntimeCreateItems('custom', {
                id: 'custom',
                createItems: [{ id: 'dusd', count: 3 }],
                itemCountOperations: [
                    {
                        operation: 'withdraw-all',
                        containerItemId: 'jar',
                        itemId: 'dusd',
                    },
                ],
            })
        ).toEqual([{ id: 'dusd', count: 5 }]);
    });
});
