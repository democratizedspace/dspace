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
    skipProcess,
    startProcess,
} from '../src/utils/gameState/processes.js';
import { loadGameState, saveGameState } from '../src/utils/gameState/common.js';

const JAR_ID = '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec';
const BROKEN_JAR_ID = 'd6df111f-6d30-4720-ab2f-cd6f27e9e3f3';
const DUSD_ID = '5247a603-294a-4a34-a884-1ae20969b2a1';

describe('container process behavior', () => {
    let mockGameState;

    beforeEach(() => {
        mockGameState = {
            inventory: {
                [JAR_ID]: 1,
                [DUSD_ID]: 20,
            },
            itemContainerCounts: {},
            processes: {},
        };

        vi.mocked(loadGameState).mockImplementation(() => mockGameState);
        vi.mocked(saveGameState).mockImplementation((newState) => {
            mockGameState = newState;
        });
    });

    test('deposit process consumes dUSD and stores it in container balance', () => {
        const depositDefinition = {
            id: 'deposit',
            duration: '1s',
            requireItems: [{ id: JAR_ID, count: 1 }],
            consumeItems: [{ id: DUSD_ID, count: 10 }],
            createItems: [],
            itemCountOperations: [
                {
                    operation: 'deposit',
                    containerItemId: JAR_ID,
                    itemId: DUSD_ID,
                    count: 10,
                },
            ],
        };

        startProcess('deposit', depositDefinition);
        expect(mockGameState.inventory[DUSD_ID]).toBe(10);
        expect(getProcessState('deposit').state).toBe(ProcessStates.IN_PROGRESS);

        mockGameState.processes.deposit.startedAt = Date.now() - 5000;
        finishProcess('deposit', depositDefinition);

        expect(mockGameState.itemContainerCounts[JAR_ID][DUSD_ID]).toBe(10);
    });

    test('withdraw-all process returns full container balance and clears it', () => {
        mockGameState.itemContainerCounts = {
            [JAR_ID]: {
                [DUSD_ID]: 9,
            },
        };

        const breakDefinition = {
            id: 'break-jar',
            duration: '1s',
            requireItems: [{ id: JAR_ID, count: 1 }],
            consumeItems: [{ id: JAR_ID, count: 1 }],
            createItems: [{ id: BROKEN_JAR_ID, count: 1 }],
            itemCountOperations: [
                {
                    operation: 'withdraw-all',
                    containerItemId: JAR_ID,
                    itemId: DUSD_ID,
                },
            ],
        };

        startProcess('break-jar', breakDefinition);
        mockGameState.processes['break-jar'].startedAt = Date.now() - 5000;
        finishProcess('break-jar', breakDefinition);

        expect(mockGameState.inventory[JAR_ID]).toBe(0);
        expect(mockGameState.inventory[BROKEN_JAR_ID]).toBe(1);
        expect(mockGameState.inventory[DUSD_ID]).toBe(29);
        expect(mockGameState.itemContainerCounts[JAR_ID][DUSD_ID]).toBe(0);
    });

    test('skipProcess applies itemCountOperations consistently', () => {
        const depositDefinition = {
            id: 'deposit-skip',
            duration: '1s',
            requireItems: [{ id: JAR_ID, count: 1 }],
            consumeItems: [{ id: DUSD_ID, count: 10 }],
            createItems: [],
            itemCountOperations: [
                {
                    operation: 'deposit',
                    containerItemId: JAR_ID,
                    itemId: DUSD_ID,
                    count: 10,
                },
            ],
        };

        skipProcess('deposit-skip', depositDefinition);

        expect(mockGameState.inventory[DUSD_ID]).toBe(10);
        expect(mockGameState.itemContainerCounts[JAR_ID][DUSD_ID]).toBe(10);
    });
});
