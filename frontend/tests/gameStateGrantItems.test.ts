import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(),
    saveGameState: vi.fn(),
    validateGameState: (state: unknown) => state,
}));

vi.mock('../src/utils/gameState/inventory.js', () => ({
    addItems: vi.fn(),
}));

import {
    getItemsGranted,
    grantItems,
    setCurrentDialogueStep,
} from '../src/utils/gameState.js';
import { addItems } from '../src/utils/gameState/inventory.js';
import { loadGameState, saveGameState } from '../src/utils/gameState/common.js';

describe('gameState grantsItems claim-once behavior', () => {
    let mockGameState: {
        quests: Record<string, { itemsClaimed?: string[]; stepId?: number | string }>;
        inventory: Record<string, number>;
    };

    beforeEach(() => {
        mockGameState = {
            quests: {},
            inventory: {},
        };

        vi.mocked(loadGameState).mockImplementation(() => mockGameState);
        vi.mocked(saveGameState).mockImplementation((nextState) => {
            mockGameState = nextState as typeof mockGameState;
        });
        vi.mocked(addItems).mockReset();
    });

    test('grants items only once when quest progress is initially missing', () => {
        const rewardItems = [{ id: 'item-1', count: 1 }];

        grantItems('aquaria/ph-strip-test', 'start', 0, rewardItems);
        grantItems('aquaria/ph-strip-test', 'start', 0, rewardItems);

        expect(addItems).toHaveBeenCalledTimes(1);
        expect(mockGameState.quests['aquaria/ph-strip-test']).toEqual({
            itemsClaimed: ['aquaria/ph-strip-test-start-0'],
        });
        expect(
            getItemsGranted('aquaria/ph-strip-test', 'start', 0)
        ).toBe(true);
    });

    test('setCurrentDialogueStep preserves existing quest claim data', () => {
        mockGameState.quests['aquaria/ph-strip-test'] = {
            itemsClaimed: ['aquaria/ph-strip-test-start-0'],
        };

        setCurrentDialogueStep('aquaria/ph-strip-test', 'middle');

        expect(mockGameState.quests['aquaria/ph-strip-test']).toEqual({
            itemsClaimed: ['aquaria/ph-strip-test-start-0'],
            stepId: 'middle',
        });
    });

    test('getItemsGranted returns false for missing quest progress', () => {
        expect(getItemsGranted('missing/quest', 'start', 0)).toBe(false);
    });
});
