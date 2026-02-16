import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
    ProcessStates,
    finishProcess,
    getProcessState,
    hasRequiredAndConsumedItems,
    startProcess,
} from '../src/utils/gameState/processes.js';

const loadGameStateMock = vi.hoisted(() => vi.fn());
const saveGameStateMock = vi.hoisted(() => vi.fn());
const hasItemsMock = vi.hoisted(() => vi.fn(() => true));
const burnItemsMock = vi.hoisted(() => vi.fn());
const addItemsMock = vi.hoisted(() => vi.fn());
const addStoredItemsMock = vi.hoisted(() => vi.fn());
const canStoreItemInContainerMock = vi.hoisted(() => vi.fn(() => true));
const getStoredItemCountMock = vi.hoisted(() => vi.fn(() => 0));
const removeStoredItemsMock = vi.hoisted(() => vi.fn(() => 0));
const removeAllStoredItemsMock = vi.hoisted(() => vi.fn(() => 0));

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: (...args: unknown[]) => loadGameStateMock(...args),
    saveGameState: (...args: unknown[]) => saveGameStateMock(...args),
}));

vi.mock('../src/utils/gameState/inventory.js', () => ({
    hasItems: (...args: unknown[]) => hasItemsMock(...args),
    burnItems: (...args: unknown[]) => burnItemsMock(...args),
    addItems: (...args: unknown[]) => addItemsMock(...args),
}));

vi.mock('../src/utils/gameState/itemContainers.js', () => ({
    addStoredItems: (...args: unknown[]) => addStoredItemsMock(...args),
    canStoreItemInContainer: (...args: unknown[]) => canStoreItemInContainerMock(...args),
    getStoredItemCount: (...args: unknown[]) => getStoredItemCountMock(...args),
    removeStoredItems: (...args: unknown[]) => removeStoredItemsMock(...args),
    removeAllStoredItems: (...args: unknown[]) => removeAllStoredItemsMock(...args),
}));

vi.mock('../src/generated/processes.json', () => ({ default: [] }));

describe('process itemCountOperations', () => {
    type GameState = { processes: Record<string, Record<string, unknown> | undefined> };
    let gameState: GameState;

    beforeEach(() => {
        vi.useFakeTimers();
        gameState = { processes: {} };

        loadGameStateMock.mockImplementation(() => gameState);
        saveGameStateMock.mockImplementation((nextState: GameState) => {
            gameState = nextState;
        });

        hasItemsMock.mockReturnValue(true);
        getStoredItemCountMock.mockReturnValue(20);
        addItemsMock.mockReset();
        addStoredItemsMock.mockReset();
        removeAllStoredItemsMock.mockReset();
    });

    test('accepts deposit operations as start requirements and applies on finish', () => {
        const definition = {
            id: 'save-dusd-in-jar',
            duration: '1s',
            requireItems: [],
            consumeItems: [{ id: 'dusd', count: 10 }],
            createItems: [],
            itemCountOperations: [
                {
                    operation: 'deposit',
                    containerItemId: 'jar',
                    itemId: 'dusd',
                    count: 10,
                },
            ],
        };

        expect(hasRequiredAndConsumedItems(definition.id, definition)).toBe(true);

        startProcess(definition.id, definition);
        vi.advanceTimersByTime(1500);
        expect(getProcessState(definition.id).state).toBe(ProcessStates.FINISHED);

        finishProcess(definition.id, definition);

        expect(addStoredItemsMock).toHaveBeenCalledWith('jar', 'dusd', 10);
    });

    test('withdraw-all operations must have stored balance and add retrieved inventory on finish', () => {
        const definition = {
            id: 'break-savings-jar',
            duration: '1s',
            requireItems: [],
            consumeItems: [{ id: 'jar', count: 1 }],
            createItems: [{ id: 'broken-jar', count: 1 }],
            itemCountOperations: [
                {
                    operation: 'withdraw-all',
                    containerItemId: 'jar',
                    itemId: 'dusd',
                },
            ],
        };

        getStoredItemCountMock.mockReturnValue(15.75);
        removeAllStoredItemsMock.mockReturnValue(15.75);

        expect(hasRequiredAndConsumedItems(definition.id, definition)).toBe(true);

        startProcess(definition.id, definition);
        vi.advanceTimersByTime(1500);
        finishProcess(definition.id, definition);

        expect(removeAllStoredItemsMock).toHaveBeenCalledWith('jar', 'dusd');
        expect(addItemsMock).toHaveBeenCalledWith([{ id: 'broken-jar', count: 1 }]);
        expect(addItemsMock).toHaveBeenCalledWith([{ id: 'dusd', count: 15.75 }]);
    });
});
