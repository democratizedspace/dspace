import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(),
    saveGameState: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../src/generated/processes.json', () => ({
    default: [],
}));

import {
    ProcessStates,
    finishProcess,
    getProcessState,
    skipProcess,
    startProcess,
} from '../src/utils/gameState/processes.js';
import { loadGameState, saveGameState } from '../src/utils/gameState/common.js';
import { getStoredItemCount } from '../src/utils/gameState/itemContainers.js';

describe('container process behavior', () => {
    type MockGameState = {
        inventory: Record<string, number>;
        itemContainerCounts: Record<string, Record<string, number>>;
        processes: Record<string, { startedAt: number }>;
    };

    let mockGameState: MockGameState;

    beforeEach(() => {
        mockGameState = {
            inventory: {
                '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec': 1,
                '5247a603-294a-4a34-a884-1ae20969b2a1': 20,
            },
            itemContainerCounts: {},
            processes: {},
        };

        vi.mocked(loadGameState).mockImplementation(() => mockGameState);
        vi.mocked(saveGameState).mockImplementation((newState: MockGameState) => {
            mockGameState = newState;
        });
    });

    test('deposit process stores dUSD on finish using itemCountOperations', () => {
        const depositDefinition = {
            id: 'deposit',
            duration: '1s',
            requireItems: [{ id: '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec', count: 1 }],
            consumeItems: [{ id: '5247a603-294a-4a34-a884-1ae20969b2a1', count: 10 }],
            createItems: [],
            itemCountOperations: [
                {
                    operation: 'deposit',
                    containerItemId: '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec',
                    itemId: '5247a603-294a-4a34-a884-1ae20969b2a1',
                    count: 10,
                },
            ],
        };

        startProcess('deposit', depositDefinition);

        expect(mockGameState.inventory['5247a603-294a-4a34-a884-1ae20969b2a1']).toBe(10);
        expect(getProcessState('deposit').state).toBe(ProcessStates.IN_PROGRESS);

        mockGameState.processes.deposit.startedAt = Date.now() - 5000;
        finishProcess('deposit', depositDefinition);

        expect(
            getStoredItemCount(
                '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec',
                '5247a603-294a-4a34-a884-1ae20969b2a1'
            )
        ).toBe(10);
    });

    test('withdraw-all process returns full stored balance and clears on finish', () => {
        mockGameState.itemContainerCounts = {
            '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec': {
                '5247a603-294a-4a34-a884-1ae20969b2a1': 9,
            },
        };

        const withdrawDefinition = {
            id: 'withdraw-all',
            duration: '1s',
            requireItems: [{ id: '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec', count: 1 }],
            consumeItems: [{ id: '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec', count: 1 }],
            createItems: [{ id: 'a7a906ff-1dd9-4d0d-a67f-4fa4735d2f4a', count: 1 }],
            itemCountOperations: [
                {
                    operation: 'withdraw-all',
                    containerItemId: '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec',
                    itemId: '5247a603-294a-4a34-a884-1ae20969b2a1',
                },
            ],
        };

        startProcess('withdraw-all', withdrawDefinition);
        mockGameState.processes['withdraw-all'].startedAt = Date.now() - 5000;
        finishProcess('withdraw-all', withdrawDefinition);

        expect(mockGameState.inventory['830d74da-9de5-44c7-8b9f-83a1ed3aa8ec']).toBe(0);
        expect(mockGameState.inventory['5247a603-294a-4a34-a884-1ae20969b2a1']).toBe(29);
        expect(mockGameState.inventory['a7a906ff-1dd9-4d0d-a67f-4fa4735d2f4a']).toBe(1);
        expect(
            getStoredItemCount(
                '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec',
                '5247a603-294a-4a34-a884-1ae20969b2a1'
            )
        ).toBe(0);
    });

    test('skipProcess applies itemCountOperations the same way as finish', () => {
        const depositDefinition = {
            id: 'deposit-skip',
            duration: '1s',
            requireItems: [{ id: '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec', count: 1 }],
            consumeItems: [{ id: '5247a603-294a-4a34-a884-1ae20969b2a1', count: 10 }],
            createItems: [],
            itemCountOperations: [
                {
                    operation: 'deposit',
                    containerItemId: '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec',
                    itemId: '5247a603-294a-4a34-a884-1ae20969b2a1',
                    count: 10,
                },
            ],
        };

        skipProcess('deposit-skip', depositDefinition);

        expect(mockGameState.inventory['5247a603-294a-4a34-a884-1ae20969b2a1']).toBe(10);
        expect(
            getStoredItemCount(
                '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec',
                '5247a603-294a-4a34-a884-1ae20969b2a1'
            )
        ).toBe(10);
    });
});
