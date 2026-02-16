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
import { getStoredItemCount } from '../src/utils/gameState/itemContainers.js';

describe('container process behavior', () => {
    type MockGameState = {
        inventory: Record<string, number>;
        inventoryItemCounts: Record<string, Record<string, number>>;
        processes: Record<string, { startedAt: number }>;
    };

    let mockGameState: MockGameState;

    beforeEach(() => {
        mockGameState = {
            inventory: {
                '66c2cdc6-9517-4c96-937f-1ddb4ee06ef3': 1,
                '5247a603-294a-4a34-a884-1ae20969b2a1': 20,
            },
            inventoryItemCounts: {},
            processes: {},
        };

        vi.mocked(loadGameState).mockImplementation(() => mockGameState);
        vi.mocked(saveGameState).mockImplementation((newState: MockGameState) => {
            mockGameState = newState;
        });
    });

    test('deposit process stores dUSD in container balance', () => {
        const depositDefinition = {
            id: 'deposit',
            duration: '1s',
            requireItems: [{ id: '66c2cdc6-9517-4c96-937f-1ddb4ee06ef3', count: 1 }],
            consumeItems: [{ id: '5247a603-294a-4a34-a884-1ae20969b2a1', count: 7 }],
            createItems: [],
            itemCountOperations: [
                {
                    operation: 'deposit',
                    containerItemId: '66c2cdc6-9517-4c96-937f-1ddb4ee06ef3',
                    itemId: '5247a603-294a-4a34-a884-1ae20969b2a1',
                    count: 7,
                },
            ],
        };

        startProcess('deposit', depositDefinition);

        expect(mockGameState.inventory['5247a603-294a-4a34-a884-1ae20969b2a1']).toBe(13);
        expect(getProcessState('deposit').state).toBe(ProcessStates.IN_PROGRESS);

        mockGameState.processes.deposit.startedAt = Date.now() - 5000;
        finishProcess('deposit', depositDefinition);

        expect(
            getStoredItemCount(
                '66c2cdc6-9517-4c96-937f-1ddb4ee06ef3',
                '5247a603-294a-4a34-a884-1ae20969b2a1'
            )
        ).toBe(7);
    });

    test('withdraw-all process returns full container balance and clears it', () => {
        mockGameState.inventoryItemCounts = {
            '66c2cdc6-9517-4c96-937f-1ddb4ee06ef3': {
                '5247a603-294a-4a34-a884-1ae20969b2a1': 9,
            },
        };

        const withdrawDefinition = {
            id: 'withdraw-all',
            duration: '1s',
            requireItems: [],
            consumeItems: [{ id: '66c2cdc6-9517-4c96-937f-1ddb4ee06ef3', count: 1 }],
            createItems: [],
            itemCountOperations: [
                {
                    operation: 'withdraw-all',
                    containerItemId: '66c2cdc6-9517-4c96-937f-1ddb4ee06ef3',
                    itemId: '5247a603-294a-4a34-a884-1ae20969b2a1',
                },
            ],
        };

        startProcess('withdraw-all', withdrawDefinition);
        mockGameState.processes['withdraw-all'].startedAt = Date.now() - 5000;
        finishProcess('withdraw-all', withdrawDefinition);

        expect(mockGameState.inventory['66c2cdc6-9517-4c96-937f-1ddb4ee06ef3']).toBe(0);
        expect(mockGameState.inventory['5247a603-294a-4a34-a884-1ae20969b2a1']).toBe(29);
        expect(
            getStoredItemCount(
                '66c2cdc6-9517-4c96-937f-1ddb4ee06ef3',
                '5247a603-294a-4a34-a884-1ae20969b2a1'
            )
        ).toBe(0);
    });
});
