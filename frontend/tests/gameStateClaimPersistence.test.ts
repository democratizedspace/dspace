import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(),
    saveGameState: vi.fn(),
    validateGameState: (state: unknown) => state,
    isUsingLocalStorage: () => false,
}));

vi.mock('../src/utils/gameState/inventory.js', () => ({
    addItems: vi.fn(),
}));

import { finishQuest, grantItems, setCurrentDialogueStep } from '../src/utils/gameState.js';
import { loadGameState, saveGameState } from '../src/utils/gameState/common.js';

describe('grantItems claim tracking persistence', () => {
    let mockGameState: Record<string, unknown>;

    beforeEach(() => {
        mockGameState = {
            quests: {},
            inventory: {},
        };

        vi.mocked(loadGameState).mockImplementation(() => mockGameState as never);
        vi.mocked(saveGameState).mockImplementation((state) => {
            mockGameState = state as never;
        });
    });

    test('preserves itemsClaimed when dialogue step changes', () => {
        grantItems('aquaria/ph-strip-test', 'start', 0, [{ id: 'ph-strip', count: 1 }]);

        setCurrentDialogueStep('aquaria/ph-strip-test', 'continue');

        expect(mockGameState.quests).toEqual({
            'aquaria/ph-strip-test': {
                itemsClaimed: ['aquaria/ph-strip-test-start-0'],
                stepId: 'continue',
            },
        });
    });

    test('preserves itemsClaimed when quest is finished', () => {
        grantItems('aquaria/ph-strip-test', 'start', 0, [{ id: 'ph-strip', count: 1 }]);

        finishQuest('aquaria/ph-strip-test', []);

        expect(mockGameState.quests).toEqual({
            'aquaria/ph-strip-test': {
                itemsClaimed: ['aquaria/ph-strip-test-start-0'],
                finished: true,
            },
        });
    });
});
