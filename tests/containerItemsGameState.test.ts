import { beforeEach, describe, expect, test, vi } from 'vitest';

const loadGameStateMock = vi.hoisted(() => vi.fn());
const saveGameStateMock = vi.hoisted(() => vi.fn());

vi.mock('../frontend/src/utils/gameState/common.js', () => ({
    loadGameState: (...args: unknown[]) => loadGameStateMock(...args),
    saveGameState: (...args: unknown[]) => saveGameStateMock(...args),
}));

import {
    getContainerItemCount,
    moveContainerItemToInventory,
    moveInventoryItemToContainer,
    withdrawAllFromContainerToInventory,
} from '../frontend/src/utils/gameState/inventory.js';
import {
    finishProcess,
    hasRequiredAndConsumedItems,
    ProcessStates,
    getProcessState,
} from '../frontend/src/utils/gameState/processes.js';

const dUSD_ID = '5247a603-294a-4a34-a884-1ae20969b2a1';
const SAVINGS_JAR_ID = 'b7046e45-1cce-4cb8-9a23-6045c74cd667';
const BROKEN_JAR_ID = '5139e813-8097-4325-9581-545775a633ad';

describe('container item counts', () => {
    type GameState = {
        inventory: Record<string, number>;
        itemContainerCounts: Record<string, Record<string, number>>;
        processes: Record<string, any>;
    };

    let gameState: GameState;

    beforeEach(() => {
        gameState = {
            inventory: {
                [dUSD_ID]: 200,
                [SAVINGS_JAR_ID]: 1,
            },
            itemContainerCounts: {},
            processes: {},
        };

        loadGameStateMock.mockImplementation(() => gameState);
        saveGameStateMock.mockImplementation((nextState: GameState) => {
            gameState = nextState;
        });
    });

    test('moves dUSD from inventory to savings jar and supports withdraw all', () => {
        expect(moveInventoryItemToContainer(SAVINGS_JAR_ID, dUSD_ID, 25)).toBe(true);
        expect(gameState.inventory[dUSD_ID]).toBe(175);
        expect(getContainerItemCount(SAVINGS_JAR_ID, dUSD_ID)).toBe(25);

        expect(moveContainerItemToInventory(SAVINGS_JAR_ID, dUSD_ID, 5)).toBe(true);
        expect(gameState.inventory[dUSD_ID]).toBe(180);
        expect(getContainerItemCount(SAVINGS_JAR_ID, dUSD_ID)).toBe(20);

        expect(withdrawAllFromContainerToInventory(SAVINGS_JAR_ID, dUSD_ID)).toBe(20);
        expect(gameState.inventory[dUSD_ID]).toBe(200);
        expect(getContainerItemCount(SAVINGS_JAR_ID, dUSD_ID)).toBe(0);
    });

    test('process transfer requirements enforce container configuration', () => {
        const validDeposit = {
            id: 'deposit',
            duration: '1s',
            requireItems: [{ id: SAVINGS_JAR_ID, count: 1 }],
            consumeItems: [],
            createItems: [],
            containerItemTransfers: [
                {
                    containerId: SAVINGS_JAR_ID,
                    itemId: dUSD_ID,
                    count: 10,
                    direction: 'toContainer',
                },
            ],
        };

        expect(hasRequiredAndConsumedItems(validDeposit.id, validDeposit)).toBe(true);

        const invalidDeposit = {
            ...validDeposit,
            containerItemTransfers: [
                {
                    containerId: SAVINGS_JAR_ID,
                    itemId: BROKEN_JAR_ID,
                    count: 1,
                    direction: 'toContainer',
                },
            ],
        };

        expect(hasRequiredAndConsumedItems(invalidDeposit.id, invalidDeposit)).toBe(false);
    });

    test('break jar process returns all stored dUSD on finish', () => {
        gameState.processes['break-savings-jar'] = {
            startedAt: Date.now() - 10_000,
            duration: 1000,
            pausedAt: null,
            elapsedBeforePause: 0,
            pauseModelVersion: 2,
        };
        gameState.itemContainerCounts[SAVINGS_JAR_ID] = { [dUSD_ID]: 37.5 };

        const processDef = {
            id: 'break-savings-jar',
            duration: '1s',
            requireItems: [{ id: SAVINGS_JAR_ID, count: 1 }],
            consumeItems: [{ id: SAVINGS_JAR_ID, count: 1 }],
            createItems: [{ id: BROKEN_JAR_ID, count: 1 }],
            containerItemTransfers: [
                {
                    containerId: SAVINGS_JAR_ID,
                    itemId: dUSD_ID,
                    count: 'all',
                    direction: 'toInventory',
                },
            ],
        };

        expect(getProcessState('break-savings-jar').state).toBe(ProcessStates.FINISHED);
        finishProcess('break-savings-jar', processDef);

        expect(gameState.inventory[dUSD_ID]).toBeCloseTo(237.5);
        expect(gameState.inventory[BROKEN_JAR_ID]).toBe(1);
        expect(gameState.itemContainerCounts[SAVINGS_JAR_ID][dUSD_ID]).toBe(0);
    });
});
