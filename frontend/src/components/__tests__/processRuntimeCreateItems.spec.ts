import { vi, describe, test, expect, beforeEach } from 'vitest';
import processes from '../../generated/processes.json';

const getStoredItemCountMock = vi.hoisted(() => vi.fn());

vi.mock('../../utils/gameState/itemContainers.js', () => ({
    canStoreItemInContainer: vi.fn(() => true),
    getStoredItemCount: (...args: unknown[]) => getStoredItemCountMock(...args),
    addStoredItemsToState: vi.fn(),
    removeStoredItemsFromState: vi.fn(),
    removeAllStoredItemsFromState: vi.fn(),
}));

import { getRuntimeCreateItems } from '../../utils/gameState/processes.js';

describe('getRuntimeCreateItems', () => {
    beforeEach(() => {
        getStoredItemCountMock.mockReset();
    });

    test('includes withdraw-all item counts alongside static create items', () => {
        getStoredItemCountMock.mockReturnValue(37);

        expect(
            getRuntimeCreateItems('runtime-create', {
                id: 'runtime-create',
                createItems: [{ id: 'broken-jar', count: 1 }],
                itemCountOperations: [
                    {
                        operation: 'withdraw-all',
                        containerItemId: 'jar',
                        itemId: 'dusd',
                    },
                ],
            })
        ).toEqual([
            { id: 'broken-jar', count: 1 },
            { id: 'dusd', count: 37 },
        ]);
    });

    test('uses savings-jar-break generated process for runtime creates', () => {
        getStoredItemCountMock.mockReturnValue(37);

        expect(getRuntimeCreateItems('savings-jar-break')).toEqual([
            { id: 'f797d8de-11c5-4f89-a725-c2ac2255d173', count: 1 },
            { id: '5247a603-294a-4a34-a884-1ae20969b2a1', count: 37 },
        ]);

        const savingsJarBreak = processes.find((process) => process.id === 'savings-jar-break');
        expect(savingsJarBreak?.title).toBe('Break savings jar and retrieve all dUSD');
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

    test('caps withdraw projection by available count', () => {
        getStoredItemCountMock.mockReturnValue(10);

        expect(
            getRuntimeCreateItems('custom', {
                id: 'custom',
                createItems: [],
                itemCountOperations: [
                    {
                        operation: 'withdraw',
                        containerItemId: 'jar',
                        itemId: 'dusd',
                        count: 15,
                    },
                ],
            })
        ).toEqual([{ id: 'dusd', count: 10 }]);
    });

    test('tracks remaining balance across sequential withdraw operations', () => {
        getStoredItemCountMock.mockReturnValue(10);

        expect(
            getRuntimeCreateItems('custom', {
                id: 'custom',
                createItems: [],
                itemCountOperations: [
                    {
                        operation: 'withdraw',
                        containerItemId: 'jar',
                        itemId: 'dusd',
                        count: 7,
                    },
                    {
                        operation: 'withdraw',
                        containerItemId: 'jar',
                        itemId: 'dusd',
                        count: 7,
                    },
                ],
            })
        ).toEqual([{ id: 'dusd', count: 10 }]);
    });
});
