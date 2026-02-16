import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { finishProcess, getProcessState, startProcess } from '../src/utils/gameState/processes.js';
import {
    getInventoryCountFromEntry,
    getContainedItemCount,
} from '../src/utils/gameState/inventoryEntries.js';

const loadGameStateMock = vi.hoisted(() => vi.fn());
const saveGameStateMock = vi.hoisted(() => vi.fn());

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: (...args: unknown[]) => loadGameStateMock(...args),
    saveGameState: (...args: unknown[]) => saveGameStateMock(...args),
}));

const dUSDId = '5247a603-294a-4a34-a884-1ae20969b2a1';
const jarId = 'cc89cbc9-7d07-4dbb-a8ea-0ba34951c080';
const brokenJarId = 'dc2626d8-4bec-4105-bfbe-625fd045250b';

describe('process container item support', () => {
    let gameState: {
        inventory: Record<string, unknown>;
        processes: Record<string, unknown>;
    };

    beforeEach(() => {
        vi.useFakeTimers();
        gameState = {
            inventory: {
                [dUSDId]: 100,
                [jarId]: { count: 1, itemCounts: { [dUSDId]: 0 } },
            },
            processes: {},
        };

        loadGameStateMock.mockImplementation(() => structuredClone(gameState));
        saveGameStateMock.mockImplementation((state: typeof gameState) => {
            gameState = structuredClone(state);
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('stores consumed currency in jar and releases it after breaking', () => {
        const depositProcess = {
            id: 'deposit-savings-jar',
            duration: '1s',
            requireItems: [{ id: jarId, count: 1 }],
            consumeItems: [{ id: dUSDId, count: 10 }],
            createItems: [],
            storeItems: [{ containerId: jarId, itemId: dUSDId, count: 10 }],
        };

        startProcess(depositProcess.id, depositProcess);

        expect(getInventoryCountFromEntry(gameState.inventory[dUSDId])).toBe(90);
        expect(getContainedItemCount(gameState.inventory, jarId, dUSDId)).toBe(10);

        const breakProcess = {
            id: 'break-savings-jar',
            duration: '1s',
            requireItems: [{ id: jarId, count: 1 }],
            consumeItems: [{ id: jarId, count: 1 }],
            createItems: [{ id: brokenJarId, count: 1 }],
            releaseItems: [{ containerId: jarId, itemId: dUSDId, count: 'all' as const }],
        };

        startProcess(breakProcess.id, breakProcess);
        vi.advanceTimersByTime(1100);

        expect(getProcessState(breakProcess.id).state).toBe('finished');
        finishProcess(breakProcess.id, breakProcess);

        expect(getInventoryCountFromEntry(gameState.inventory[dUSDId])).toBe(100);
        expect(getInventoryCountFromEntry(gameState.inventory[brokenJarId])).toBe(1);
        expect(getContainedItemCount(gameState.inventory, jarId, dUSDId)).toBe(0);
        expect(getInventoryCountFromEntry(gameState.inventory[jarId])).toBe(0);
    });
});
