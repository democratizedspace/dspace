import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(),
    saveGameState: vi.fn().mockResolvedValue(undefined),
    validateGameState: (state: unknown) => state,
}));

vi.mock('../src/utils/gameState/inventory.js', () => ({
    addItems: vi.fn(),
}));

import { canStartQuest, questFinished } from '../src/utils/gameState.js';
import { loadGameState } from '../src/utils/gameState/common.js';

describe('gameState quest id aliases', () => {
    const state = {
        quests: {} as Record<string, { finished?: boolean }>,
        inventory: {},
        versionNumberString: '3',
    };

    beforeEach(() => {
        state.quests = {};
        vi.mocked(loadGameState).mockImplementation(() => state);
    });

    test('questFinished treats 3dprinter/start as alias for 3dprinting/start', () => {
        state.quests['3dprinter/start'] = { finished: true };

        expect(questFinished('3dprinting/start')).toBe(true);
    });

    test('canStartQuest unlocks quests requiring canonical id when legacy alias is completed', () => {
        state.quests['3dprinter/start'] = { finished: true };
        const quest = {
            id: 'rocketry/firstlaunch',
            default: { requiresQuests: ['3dprinting/start'] },
        };

        expect(canStartQuest(quest)).toBe(true);
    });
});
