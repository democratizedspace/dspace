import { describe, beforeEach, expect, test, vi } from 'vitest';

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(),
    saveGameState: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../src/generated/processes.json', () => ({ default: [] }));

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
    const jarId = '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec';
    const dusdId = '5247a603-294a-4a34-a884-1ae20969b2a1';

    beforeEach(() => {
        mockGameState = {
            inventory: { [jarId]: 1, [dusdId]: 20 },
            itemContainerCounts: {},
            processes: {},
        };

        vi.mocked(loadGameState).mockImplementation(() => mockGameState as never);
        vi.mocked(saveGameState).mockImplementation((newState: MockGameState) => {
            mockGameState = newState;
        });
    });

    test('deposit process consumes dUSD and stores it through finish', () => {
        const depositDefinition = {
            id: 'deposit',
            duration: '1s',
            requireItems: [{ id: jarId, count: 1 }],
            consumeItems: [{ id: dusdId, count: 10 }],
            createItems: [],
            itemCountOperations: [
                { operation: 'deposit', containerItemId: jarId, itemId: dusdId, count: 10 },
            ],
        };

        startProcess('deposit', depositDefinition);

        expect(mockGameState.inventory[dusdId]).toBe(10);
        expect(getProcessState('deposit').state).toBe(ProcessStates.IN_PROGRESS);

        mockGameState.processes.deposit.startedAt = Date.now() - 5_000;
        finishProcess('deposit', depositDefinition);

        expect(getStoredItemCount(jarId, dusdId)).toBe(10);
    });

    test('withdraw-all through skip process returns full stored balance and clears it', () => {
        mockGameState.itemContainerCounts = { [jarId]: { [dusdId]: 9 } };

        const breakDefinition = {
            id: 'break',
            duration: '1s',
            requireItems: [{ id: jarId, count: 1 }],
            consumeItems: [{ id: jarId, count: 1 }],
            createItems: [],
            itemCountOperations: [
                { operation: 'withdraw-all', containerItemId: jarId, itemId: dusdId },
            ],
        };

        skipProcess('break', breakDefinition);

        expect(mockGameState.inventory[jarId]).toBe(0);
        expect(mockGameState.inventory[dusdId]).toBe(29);
        expect(getStoredItemCount(jarId, dusdId)).toBe(0);
    });
});
