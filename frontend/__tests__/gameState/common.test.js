import 'fake-indexeddb/auto';
const {
    loadGameState,
    saveGameState,
    exportGameStateString,
    importGameStateString,
    resetGameState,
    rollbackGameState,
    validateGameState,
} = require('../../src/utils/gameState/common.js');

describe('gameState - common utilities', () => {
    beforeEach(() => {
        resetGameState();
    });

    test('resetGameState should initialize empty state', async () => {
        const state = loadGameState();
        state.inventory['1'] = 5;
        await saveGameState(state);

        resetGameState();
        const fresh = loadGameState();
        expect(fresh).toEqual({ quests: {}, inventory: {}, processes: {} });
    });

    test('exportGameStateString should reflect latest saved state', async () => {
        const state = loadGameState();
        state.inventory['1'] = 5;
        await saveGameState(state);

        const exported = exportGameStateString();
        const decoded = JSON.parse(Buffer.from(exported, 'base64').toString('utf8'));
        expect(decoded.inventory['1']).toBe(5);
    });

    test('exportGameStateString returns base64 string', () => {
        const exported = exportGameStateString();
        expect(typeof exported).toBe('string');
        expect(() => Buffer.from(exported, 'base64').toString('utf8')).not.toThrow();
    });

    test('exportGameStateString uses stable schema', () => {
        const exported = exportGameStateString();
        const decoded = JSON.parse(Buffer.from(exported, 'base64').toString('utf8'));
        expect(Object.keys(decoded).sort()).toEqual(['inventory', 'processes', 'quests']);
    });

    test('importGameStateString should replace current state', async () => {
        const newState = { quests: { foo: true }, inventory: { 2: 3 }, processes: {} };
        const encoded = Buffer.from(JSON.stringify(newState)).toString('base64');
        await importGameStateString(encoded);
        const loaded = loadGameState();
        expect(loaded).toEqual(newState);
    });

    test('validateGameState should fill missing sections', () => {
        const corrupted = { quests: null };
        const validated = validateGameState(corrupted);
        expect(validated).toEqual({ quests: {}, inventory: {}, processes: {} });
    });

    test('rollbackGameState should restore previous state', async () => {
        const state = loadGameState();
        state.inventory['1'] = 1;
        await saveGameState(state);

        const updated = loadGameState();
        updated.inventory['1'] = 2;
        await saveGameState(updated);

        await rollbackGameState();
        const rolled = loadGameState();
        expect(rolled.inventory['1']).toBe(1);
    });

    test('rollbackGameState does nothing when no backup exists', async () => {
        const state = loadGameState();
        state.inventory['1'] = 3;
        await saveGameState(state);

        const updated = loadGameState();
        updated.inventory['1'] = 4;
        await saveGameState(updated);

        await new Promise((resolve, reject) => {
            const req = indexedDB.open('dspaceGameState', 1);
            req.onsuccess = (e) => {
                const db = e.target.result;
                const tx = db.transaction('backup', 'readwrite');
                tx.objectStore('backup').clear();
                tx.oncomplete = resolve;
                tx.onerror = (ev) => reject(ev.target.error);
            };
            req.onerror = (e) => reject(e.target.error);
        });

        await rollbackGameState();
        const rolled = loadGameState();
        expect(rolled.inventory['1']).toBe(4);
    });
});
