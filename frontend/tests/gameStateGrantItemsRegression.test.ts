import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(),
    saveGameState: vi.fn().mockResolvedValue(undefined),
    validateGameState: (s: unknown) => s,
}));

vi.mock('../src/utils/gameState/inventory.js', () => ({
    addItems: vi.fn(),
}));

import {
    getItemsGranted,
    grantItems,
    setCurrentDialogueStep,
} from '../src/utils/gameState.js';
import { loadGameState, saveGameState } from '../src/utils/gameState/common.js';
import { addItems } from '../src/utils/gameState/inventory.js';

describe('grantsItems claim lock regression', () => {
    let mockGameState: {
        quests: Record<string, Record<string, unknown>>;
        inventory: Record<string, number>;
    };

    beforeEach(() => {
        mockGameState = {
            quests: {},
            inventory: {},
        };

        vi.mocked(loadGameState).mockImplementation(() => mockGameState);
        vi.mocked(saveGameState).mockImplementation((state) => {
            mockGameState = state as typeof mockGameState;
        });
        vi.mocked(addItems).mockClear();
    });

    test('setCurrentDialogueStep preserves quest-specific fields', () => {
        mockGameState.quests.q = {
            itemsClaimed: ['q-step-0'],
            finished: false,
        };

        setCurrentDialogueStep('q', 'next-step');

        expect(mockGameState.quests.q).toEqual({
            itemsClaimed: ['q-step-0'],
            finished: false,
            stepId: 'next-step',
        });
    });

    test('grant lock survives dialogue transitions', () => {
        const items = [{ id: '2', count: 1 }];
        mockGameState.quests.q = {};

        grantItems('q', 'step', 0, items);
        setCurrentDialogueStep('q', 'other-step');
        setCurrentDialogueStep('q', 'step');
        grantItems('q', 'step', 0, items);

        expect(addItems).toHaveBeenCalledTimes(1);
        expect(getItemsGranted('q', 'step', 0)).toBe(true);
    });
});
