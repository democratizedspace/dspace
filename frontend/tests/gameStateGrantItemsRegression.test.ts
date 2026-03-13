import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(),
    saveGameState: vi.fn(),
    getGameStateChecksum: vi.fn(() => ''),
    syncGameStateFromLocalIfStale: vi.fn(),
    validateGameState: (state: unknown) => state,
    isUsingLocalStorage: vi.fn(() => false),
}));

vi.mock('../src/utils/gameState/inventory.js', () => ({
    addItems: vi.fn(),
}));

import {
    finishQuest,
    getCurrentDialogueStep,
    getItemsGranted,
    grantItems,
    setCurrentDialogueStep,
} from '../src/utils/gameState.js';
import { loadGameState, saveGameState } from '../src/utils/gameState/common.js';
import { addItems } from '../src/utils/gameState/inventory.js';

describe('gameState grantsItems claim-once regression', () => {
    let mockGameState: {
        quests: Record<string, { stepId?: string; itemsClaimed?: string[]; finished?: boolean }>;
        inventory: Record<string, number>;
        versionNumberString: string;
    };

    beforeEach(() => {
        mockGameState = {
            quests: {},
            inventory: {},
            versionNumberString: '3',
        };

        vi.mocked(loadGameState).mockClear();
        vi.mocked(saveGameState).mockClear();
        vi.mocked(addItems).mockClear();

        vi.mocked(loadGameState).mockImplementation(() => mockGameState);
        vi.mocked(saveGameState).mockImplementation((newState) => {
            mockGameState = newState as typeof mockGameState;
        });
    });

    test('preserves itemsClaimed when advancing dialogue step', () => {
        mockGameState.quests['aquaria/ph-strip-test'] = {
            stepId: 'start',
            itemsClaimed: ['aquaria/ph-strip-test-start-0'],
        };

        setCurrentDialogueStep('aquaria/ph-strip-test', 'dip');

        expect(mockGameState.quests['aquaria/ph-strip-test']).toEqual({
            stepId: 'dip',
            itemsClaimed: ['aquaria/ph-strip-test-start-0'],
        });
        expect(getItemsGranted('aquaria/ph-strip-test', 'start', 0)).toBe(true);
    });

    test('initializes missing quest progress and prevents repeated grant claims', () => {
        const grantsItems = [{ id: 'strip-item', count: 1 }];

        grantItems('aquaria/ph-strip-test', 'start', 0, grantsItems);
        expect(vi.mocked(addItems)).toHaveBeenCalledTimes(1);
        expect(getItemsGranted('aquaria/ph-strip-test', 'start', 0)).toBe(true);
        expect(getCurrentDialogueStep('aquaria/ph-strip-test')).toBe('start');
        expect(vi.mocked(saveGameState)).toHaveBeenCalledTimes(1);

        setCurrentDialogueStep('aquaria/ph-strip-test', 'dip');
        expect(vi.mocked(saveGameState)).toHaveBeenCalledTimes(2);

        const saveCallsBeforeSecondGrant = vi.mocked(saveGameState).mock.calls.length;
        grantItems('aquaria/ph-strip-test', 'start', 0, grantsItems);
        expect(vi.mocked(addItems)).toHaveBeenCalledTimes(1);
        expect(vi.mocked(saveGameState)).toHaveBeenCalledTimes(saveCallsBeforeSecondGrant);
    });

    test('creates quest progress with current step and claim key on first start-node claim', () => {
        grantItems('aquaria/ph-strip-test', 'start', 0, [{ id: 'strip-item', count: 1 }]);

        expect(mockGameState.quests['aquaria/ph-strip-test']).toEqual({
            stepId: 'start',
            itemsClaimed: ['aquaria/ph-strip-test-start-0'],
        });
        expect(getCurrentDialogueStep('aquaria/ph-strip-test')).toBe('start');
        expect(getItemsGranted('aquaria/ph-strip-test', 'start', 0)).toBe(true);
    });


    test('does not overwrite stored stepId when a grant call receives an invalid stepId argument', () => {
        mockGameState.quests['aquaria/ph-strip-test'] = {
            stepId: 'dip',
            itemsClaimed: [],
        };

        grantItems('aquaria/ph-strip-test', '', 1, [{ id: 'strip-item', count: 1 }]);

        expect(getCurrentDialogueStep('aquaria/ph-strip-test')).toBe('dip');
        expect(getItemsGranted('aquaria/ph-strip-test', '', 1)).toBe(true);
    });

    test('normalizes non-array itemsClaimed state before recording claim key', () => {
        mockGameState.quests['aquaria/ph-strip-test'] = {
            stepId: 'start',
            itemsClaimed: {} as unknown as string[],
        };

        expect(() => {
            grantItems('aquaria/ph-strip-test', 'start', 0, [{ id: 'strip-item', count: 1 }]);
        }).not.toThrow();

        expect(mockGameState.quests['aquaria/ph-strip-test'].itemsClaimed).toEqual([
            'aquaria/ph-strip-test-start-0',
        ]);
        expect(getItemsGranted('aquaria/ph-strip-test', 'start', 0)).toBe(true);
    });

    test('preserves existing quest progress when finishing quest', () => {
        mockGameState.quests['aquaria/ph-strip-test'] = {
            stepId: 'dip',
            itemsClaimed: ['aquaria/ph-strip-test-start-0'],
        };

        finishQuest('aquaria/ph-strip-test', []);

        expect(mockGameState.quests['aquaria/ph-strip-test']).toEqual({
            stepId: 'dip',
            itemsClaimed: ['aquaria/ph-strip-test-start-0'],
            finished: true,
        });
    });
});
