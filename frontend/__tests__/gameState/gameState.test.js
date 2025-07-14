const {
    finishQuest,
    questFinished,
    canStartQuest,
    setCurrentDialogueStep,
    getCurrentDialogueStep,
    grantItems,
    getItemsGranted,
    setVersionNumber,
    getVersionNumber,
    importV1V2,
    VERSIONS,
} = require('../../src/utils/gameState.js');

const { loadGameState, saveGameState } = require('../../src/utils/gameState/common.js');
const { addItems } = require('../../src/utils/gameState/inventory.js');

jest.mock('../../src/utils/gameState/common.js', () => {
    return {
        loadGameState: jest.fn(),
        saveGameState: jest.fn(),
    };
});

jest.mock('../../src/utils/gameState/inventory.js', () => {
    return {
        addItems: jest.fn(),
    };
});

describe('gameState top-level helpers', () => {
    let mockGameState;

    beforeEach(() => {
        mockGameState = {
            quests: {},
            inventory: {},
            versionNumberString: VERSIONS.V1,
        };

        loadGameState.mockImplementation(() => mockGameState);
        saveGameState.mockImplementation((state) => {
            mockGameState = state;
        });
        addItems.mockClear();
        loadGameState.mockClear();
        saveGameState.mockClear();
    });

    test('finishQuest should mark quest as finished and grant rewards', () => {
        const reward = [{ id: '1', count: 2 }];
        finishQuest('foo', reward);
        expect(addItems).toHaveBeenCalledWith(reward);
        expect(mockGameState.quests['foo']).toEqual({ finished: true });
    });

    test('questFinished should return correct status', () => {
        mockGameState.quests['bar'] = { finished: true };
        expect(questFinished('bar')).toBe(true);
        expect(questFinished('missing')).toBe(false);
    });

    test('canStartQuest respects finished and required quests', () => {
        mockGameState.quests['done'] = { finished: true };
        const quest = { id: 'done', default: { requiresQuests: ['other'] } };
        expect(canStartQuest(quest)).toBe(false); // already finished
        mockGameState.quests['done'] = { finished: false };
        expect(canStartQuest(quest)).toBe(false); // requires quest not finished
        mockGameState.quests['other'] = { finished: true };
        expect(canStartQuest(quest)).toBe(true);
    });

    test('canStartQuest returns true without requirements', () => {
        const quest = { id: 'newQuest', default: {} };
        expect(canStartQuest(quest)).toBe(true);
    });

    test('setCurrentDialogueStep and getCurrentDialogueStep work together', () => {
        setCurrentDialogueStep('quest1', 3);
        expect(getCurrentDialogueStep('quest1')).toBe(3);
    });

    test('getCurrentDialogueStep defaults to zero for missing quest', () => {
        expect(getCurrentDialogueStep('missingQuest')).toBe(0);
    });

    test('grantItems only grants once per option', () => {
        const items = [{ id: '2', count: 1 }];
        mockGameState.quests['q'] = {};
        grantItems('q', 'step', 0, items);
        expect(addItems).toHaveBeenCalledTimes(1);
        grantItems('q', 'step', 0, items);
        expect(addItems).toHaveBeenCalledTimes(1); // no duplicate
    });

    test('getItemsGranted handles missing quest gracefully', () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        const result = getItemsGranted('missing', 'step', 0);
        expect(result).toBe(false);
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
    });

    test('version helpers update version string', () => {
        setVersionNumber('10');
        expect(mockGameState.versionNumberString).toBe('10');
        expect(getVersionNumber()).toBe('10');
    });

    test('importV1V2 adds award item and sets version', () => {
        const items = [{ id: '5', count: 2 }];
        importV1V2(items);
        expect(addItems).toHaveBeenCalledWith([{ id: '85', count: 1 }, ...items]);
        expect(mockGameState.versionNumberString).toBe(VERSIONS.V2);
    });
});
