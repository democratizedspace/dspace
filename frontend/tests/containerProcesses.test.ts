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
    getItemCountOperationStartError,
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
            inventory: {
                [jarId]: 1,
                [dusdId]: 20,
            },
            itemContainerCounts: {},
            processes: {},
        };

        vi.mocked(loadGameState).mockImplementation(() => mockGameState);
        vi.mocked(saveGameState).mockImplementation((newState: MockGameState) => {
            mockGameState = newState;
            return Promise.resolve();
        });
    });

    test('deposit process consumes dUSD and stores it in container balance', () => {
        const depositDefinition = {
            id: 'deposit',
            duration: '1s',
            requireItems: [{ id: jarId, count: 1 }],
            consumeItems: [{ id: dusdId, count: 10 }],
            createItems: [],
            itemCountOperations: [
                {
                    operation: 'deposit',
                    containerItemId: jarId,
                    itemId: dusdId,
                    count: 10,
                },
            ],
        };

        startProcess('deposit', depositDefinition);

        expect(mockGameState.inventory[dusdId]).toBe(10);
        expect(getProcessState('deposit').state).toBe(ProcessStates.IN_PROGRESS);

        mockGameState.processes.deposit.startedAt = Date.now() - 5000;
        finishProcess('deposit', depositDefinition);

        expect(getStoredItemCount(jarId, dusdId)).toBe(10);
    });

    test('break process returns full container balance and clears it', () => {
        mockGameState.itemContainerCounts = {
            [jarId]: {
                [dusdId]: 9,
            },
        };

        const breakDefinition = {
            id: 'break-jar',
            duration: '1s',
            requireItems: [{ id: jarId, count: 1 }],
            consumeItems: [{ id: jarId, count: 1 }],
            createItems: [{ id: 'f797d8de-11c5-4f89-a725-c2ac2255d173', count: 1 }],
            itemCountOperations: [
                {
                    operation: 'withdraw-all',
                    containerItemId: jarId,
                    itemId: dusdId,
                },
            ],
        };

        startProcess('break-jar', breakDefinition);
        mockGameState.processes['break-jar'].startedAt = Date.now() - 5000;
        finishProcess('break-jar', breakDefinition);

        expect(mockGameState.inventory[jarId]).toBe(0);
        expect(mockGameState.inventory[dusdId]).toBe(29);
        expect(getStoredItemCount(jarId, dusdId)).toBe(0);
    });

    test('finishProcess saves container updates without stale overwrite', () => {
        const stateSnapshot: MockGameState = {
            inventory: {
                [jarId]: 1,
                [dusdId]: 10,
            },
            itemContainerCounts: {
                [jarId]: {
                    [dusdId]: 0,
                },
            },
            processes: {
                deposit: {
                    startedAt: Date.now() - 5000,
                    duration: 1000,
                },
            },
        };

        vi.mocked(loadGameState).mockImplementation(() => structuredClone(stateSnapshot));
        vi.mocked(saveGameState).mockImplementation((newState: MockGameState) => {
            Object.assign(stateSnapshot, structuredClone(newState));
            return Promise.resolve();
        });

        const depositDefinition = {
            id: 'deposit',
            duration: '1s',
            requireItems: [{ id: jarId, count: 1 }],
            consumeItems: [],
            createItems: [],
            itemCountOperations: [
                {
                    operation: 'deposit',
                    containerItemId: jarId,
                    itemId: dusdId,
                    count: 10,
                },
            ],
        };

        finishProcess('deposit', depositDefinition);

        expect(stateSnapshot.inventory[dusdId]).toBe(10);
        expect(stateSnapshot.itemContainerCounts[jarId][dusdId]).toBe(10);
    });

    test('skipProcess applies itemCountOperations', () => {
        mockGameState.itemContainerCounts = {
            [jarId]: {
                [dusdId]: 4,
            },
        };

        const withdrawDefinition = {
            id: 'withdraw',
            duration: '1s',
            requireItems: [{ id: jarId, count: 1 }],
            consumeItems: [],
            createItems: [],
            itemCountOperations: [
                {
                    operation: 'withdraw-all',
                    containerItemId: jarId,
                    itemId: dusdId,
                },
            ],
        };

        skipProcess('withdraw', withdrawDefinition);

        expect(mockGameState.inventory[dusdId]).toBe(24);
        expect(getStoredItemCount(jarId, dusdId)).toBe(0);
    });

    test('returns start errors for invalid container operations', () => {
        expect(
            getItemCountOperationStartError('invalid-pair', {
                id: 'invalid-pair',
                duration: '1s',
                itemCountOperations: [
                    {
                        operation: 'deposit',
                        containerItemId: jarId,
                        itemId: 'not-storable',
                        count: 1,
                    },
                ],
            })
        ).toContain('container cannot store that item');

        expect(
            getItemCountOperationStartError('invalid-count', {
                id: 'invalid-count',
                duration: '1s',
                itemCountOperations: [
                    {
                        operation: 'deposit',
                        containerItemId: jarId,
                        itemId: dusdId,
                        count: 0,
                    },
                ],
            })
        ).toContain('must be greater than zero');

        mockGameState.itemContainerCounts = {
            [jarId]: {
                [dusdId]: 1,
            },
        };
        expect(
            getItemCountOperationStartError('insufficient', {
                id: 'insufficient',
                duration: '1s',
                itemCountOperations: [
                    {
                        operation: 'withdraw',
                        containerItemId: jarId,
                        itemId: dusdId,
                        count: 2,
                    },
                ],
            })
        ).toContain('not enough stored balance');
    });

    test('withdraw operation adds removed items back to inventory', () => {
        mockGameState.itemContainerCounts = {
            [jarId]: {
                [dusdId]: 6,
            },
        };

        skipProcess('withdraw-some', {
            id: 'withdraw-some',
            duration: '1s',
            itemCountOperations: [
                {
                    operation: 'withdraw',
                    containerItemId: jarId,
                    itemId: dusdId,
                    count: 4,
                },
            ],
        });

        expect(mockGameState.inventory[dusdId]).toBe(24);
        expect(getStoredItemCount(jarId, dusdId)).toBe(2);
    });

    test('withdraw-all with empty storage does not add zero-count inventory', () => {
        skipProcess('withdraw-empty', {
            id: 'withdraw-empty',
            duration: '1s',
            itemCountOperations: [
                {
                    operation: 'withdraw-all',
                    containerItemId: jarId,
                    itemId: dusdId,
                },
            ],
        });

        expect(mockGameState.inventory[dusdId]).toBe(20);
        expect(getStoredItemCount(jarId, dusdId)).toBe(0);
    });
});
