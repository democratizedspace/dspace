import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(),
    saveGameState: vi.fn().mockResolvedValue(undefined),
    validateGameState: (s: unknown) => s,
    isUsingLocalStorage: vi.fn(() => true),
}));

vi.mock('../src/utils/gameState/inventory.js', () => ({
    addItems: vi.fn(),
}));

import { canStartQuest, questFinished } from '../src/utils/gameState.js';
import { loadGameState } from '../src/utils/gameState/common.js';

describe('quest alias compatibility', () => {
    const mockedLoadGameState = vi.mocked(loadGameState);

    beforeEach(() => {
        mockedLoadGameState.mockReturnValue({
            quests: {},
            inventory: {},
            processes: {},
            settings: {},
            versionNumberString: '3',
        });
    });

    test('questFinished maps legacy 3dprinter/start to canonical 3dprinting/start', () => {
        mockedLoadGameState.mockReturnValue({
            quests: {
                '3dprinter/start': { finished: true },
            },
            inventory: {},
            processes: {},
            settings: {},
            versionNumberString: '3',
        });

        expect(questFinished('3dprinting/start')).toBe(true);
    });

    test('canStartQuest accepts legacy completion for canonical requirements', () => {
        mockedLoadGameState.mockReturnValue({
            quests: {
                '3dprinter/start': { finished: true },
            },
            inventory: {},
            processes: {},
            settings: {},
            versionNumberString: '3',
        });

        const quest = {
            id: '3dprinting/bed-leveling',
            default: {
                requiresQuests: ['3dprinting/start'],
            },
        };

        expect(canStartQuest(quest)).toBe(true);
    });
});
