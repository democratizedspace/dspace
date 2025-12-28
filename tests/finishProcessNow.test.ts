import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../frontend/src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(),
    saveGameState: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../frontend/src/generated/processes.json', () => ({
    default: [
        {
            id: 'foo',
            requireItems: [],
            consumeItems: [],
            createItems: [{ id: 'item-3', count: 1 }],
            duration: '10s',
        },
    ],
}));

import {
    finishProcessNow,
    getProcessState,
    ProcessStates,
    startProcess,
} from '../frontend/src/utils/gameState/processes.js';
import { loadGameState, saveGameState } from '../frontend/src/utils/gameState/common.js';

describe('finishProcessNow', () => {
    let mockGameState: any;

    beforeEach(() => {
        mockGameState = {
            inventory: { 'item-3': 0 },
            processes: {},
        };

        loadGameState.mockImplementation(() => mockGameState);
        saveGameState.mockImplementation((nextState) => {
            mockGameState = nextState;
        });
    });

    it('does nothing when the process has not started', () => {
        finishProcessNow('foo');
        expect(getProcessState('foo').state).toBe(ProcessStates.NOT_STARTED);
        expect(mockGameState.inventory['item-3']).toBe(0);
    });

    it('finishes an in-progress process and awards items once', () => {
        startProcess('foo');
        finishProcessNow('foo');

        expect(mockGameState.inventory['item-3']).toBe(1);
        expect(getProcessState('foo').state).toBe(ProcessStates.NOT_STARTED);

        finishProcessNow('foo');
        expect(mockGameState.inventory['item-3']).toBe(1);
    });

    it('collects already-finished processes', () => {
        startProcess('foo');
        mockGameState.processes.foo.startedAt = Date.now() - 20000;

        finishProcessNow('foo');
        expect(getProcessState('foo').state).toBe(ProcessStates.NOT_STARTED);
        expect(mockGameState.inventory['item-3']).toBe(1);
    });
});
