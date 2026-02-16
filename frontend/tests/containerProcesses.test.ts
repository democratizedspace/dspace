import { describe, beforeEach, expect, test, vi } from 'vitest';

vi.mock('../src/utils/gameState/common.js', () => {
    return {
        loadGameState: vi.fn(),
        saveGameState: vi.fn().mockResolvedValue(undefined),
    };
});

vi.mock('../src/generated/processes.json', () => {
    return {
        default: [],
    };
});

import {
    ProcessStates,
    finishProcess,
    getProcessState,
    startProcess,
} from '../src/utils/gameState/processes.js';
import { loadGameState, saveGameState } from '../src/utils/gameState/common.js';
import { getContainedItemCount } from '../src/utils/gameState/inventory.js';

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

    test('deposit process consumes user-entered dUSD and stores it in container balance', () => {
        const depositDefinition = {
            id: 'deposit',
            duration: '1s',
            requireItems: [{ id: '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec', count: 1 }],
            consumeItems: [{ id: '5247a603-294a-4a34-a884-1ae20969b2a1', count: 1 }],
            createItems: [],
            containerDeposit: {
                containerItemId: '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec',
                itemId: '5247a603-294a-4a34-a884-1ae20969b2a1',
                min: 1,
            },
        };

        startProcess('deposit', depositDefinition, { containerDepositAmount: 7 });

        expect(mockGameState.inventory['5247a603-294a-4a34-a884-1ae20969b2a1']).toBe(13);
        expect(getProcessState('deposit').state).toBe(ProcessStates.IN_PROGRESS);

        mockGameState.processes.deposit.startedAt = Date.now() - 5000;
        finishProcess('deposit', depositDefinition);

        expect(
            getContainedItemCount(
                '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec',
                '5247a603-294a-4a34-a884-1ae20969b2a1'
            )
        ).toBe(7);
    });

    test('withdraw-all process returns full container balance and clears it', () => {
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
            createItems: [],
            containerWithdrawAll: {
                containerItemId: '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec',
                itemId: '5247a603-294a-4a34-a884-1ae20969b2a1',
            },
        };

        startProcess('withdraw-all', withdrawDefinition);
        mockGameState.processes['withdraw-all'].startedAt = Date.now() - 5000;
        finishProcess('withdraw-all', withdrawDefinition);

        expect(mockGameState.inventory['830d74da-9de5-44c7-8b9f-83a1ed3aa8ec']).toBe(0);
        expect(mockGameState.inventory['5247a603-294a-4a34-a884-1ae20969b2a1']).toBe(29);
        expect(
            getContainedItemCount(
                '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec',
                '5247a603-294a-4a34-a884-1ae20969b2a1'
            )
        ).toBe(0);
    });
});
