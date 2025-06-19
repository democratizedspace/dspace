const {
    loadGameState,
    saveGameState,
    exportGameStateString,
    importGameStateString,
    resetGameState,
} = require('../../src/utils/gameState/common.js');

describe('gameState - common utilities', () => {
    beforeEach(() => {
        localStorage.clear();
        resetGameState();
    });

    test('resetGameState should initialize empty state', () => {
        const state = loadGameState();
        state.inventory['1'] = 5;
        saveGameState(state);

        resetGameState();
        const fresh = loadGameState();
        expect(fresh).toEqual({ quests: {}, inventory: {}, processes: {} });
    });

    test('exportGameStateString should reflect latest saved state', () => {
        const state = loadGameState();
        state.inventory['1'] = 5;
        saveGameState(state);

        const exported = exportGameStateString();
        const decoded = JSON.parse(Buffer.from(exported, 'base64').toString('utf8'));
        expect(decoded.inventory['1']).toBe(5);
    });

    test('importGameStateString should replace current state', () => {
        const newState = { quests: { foo: true }, inventory: { 2: 3 }, processes: {} };
        const encoded = Buffer.from(JSON.stringify(newState)).toString('base64');
        importGameStateString(encoded);
        const loaded = loadGameState();
        expect(loaded).toEqual(newState);
    });
});
