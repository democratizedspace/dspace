import 'fake-indexeddb/auto';
const {
    loadGameState,
    saveGameState,
    exportGameStateString,
    importGameStateString,
    resetGameState,
    rollbackGameState,
    validateGameState,
    getGameStateChecksum,
    getPersistedGameStateChecksum,
    syncGameStateFromLocalIfStale,
} = require('../../src/utils/gameState/common.js');
const { listBuiltInQuestIds } = require('../../src/utils/builtInQuests.js');
const { getOfficialQuestStats } = require('../../src/utils/gameState/questStats.js');

describe('gameState - common utilities', () => {
    beforeEach(async () => {
        await resetGameState();
    });

    test('resetGameState should initialize empty state', async () => {
        const state = loadGameState();
        state.inventory['1'] = 5;
        await saveGameState(state);

        await resetGameState();
        const fresh = loadGameState();
        expect(fresh).toMatchObject({
            quests: {},
            inventory: {},
            processes: {},
            settings: { showChatDebugPayload: false, showQuestGraphVisualizer: false },
            versionNumberString: '3',
        });
        expect(typeof fresh._meta?.lastUpdated).toBe('number');
    });

    const decodeBase64Json = (value) => JSON.parse(Buffer.from(value, 'base64').toString('utf8'));

    test('exportGameStateString should reflect latest saved state', async () => {
        const state = loadGameState();
        state.inventory['1'] = 5;
        await saveGameState(state);

        const exported = exportGameStateString();
        const decoded = decodeBase64Json(exported);
        expect(decoded.payload.inventory['1']).toBe(5);
        expect(decoded.payload.versionNumberString).toBe('3');
        expect(decoded.schemaVersion).toBe(1);
        expect(decoded.providerHint).toBe('local-export');
    });

    test('exportGameStateString returns base64 string', () => {
        const exported = exportGameStateString();
        expect(typeof exported).toBe('string');
        expect(() => decodeBase64Json(exported)).not.toThrow();
    });

    test('exportGameStateString uses stable schema', () => {
        const exported = exportGameStateString();
        const decoded = decodeBase64Json(exported);
        expect(decoded.schemaVersion).toBe(1);
        expect(typeof decoded.createdAt).toBe('string');
        expect(Object.keys(decoded.payload).sort()).toEqual([
            '_meta',
            'inventory',
            'processes',
            'quests',
            'settings',
            'versionNumberString',
        ]);
    });

    test('importGameStateString should replace current state', async () => {
        const newState = { quests: { foo: true }, inventory: { 2: 3 }, processes: {} };
        const encoded = Buffer.from(JSON.stringify(newState)).toString('base64');
        await importGameStateString(encoded);
        const loaded = loadGameState();
        expect(loaded).toMatchObject(newState);
        expect(typeof loaded._meta?.lastUpdated).toBe('number');
    });

    test('imported /gamesaves envelopes produce deterministic official quest stats', async () => {
        const [firstOfficialQuestId] = listBuiltInQuestIds();
        expect(firstOfficialQuestId).toBeTruthy();

        const envelope = {
            schemaVersion: 1,
            createdAt: '2024-01-01T00:00:00.000Z',
            providerHint: 'test',
            payload: {
                quests: {
                    [firstOfficialQuestId]: { finished: true },
                    'custom/non-official': { finished: true },
                },
                inventory: {},
                processes: {},
            },
        };

        const encoded = Buffer.from(JSON.stringify(envelope)).toString('base64');
        await importGameStateString(encoded);

        const loaded = loadGameState();
        const stats = getOfficialQuestStats(loaded);
        expect(stats.completedQuestCount).toBe(1);
        expect(stats.totalOfficialQuestCount).toBe(listBuiltInQuestIds().length);
        expect(stats.remainingOfficialQuestCount).toBe(
            stats.totalOfficialQuestCount - stats.completedQuestCount
        );
    });

    test('importGameStateString accepts backup envelopes', async () => {
        const envelope = {
            schemaVersion: 1,
            createdAt: '2024-01-01T00:00:00.000Z',
            providerHint: 'test',
            payload: { quests: { bar: true }, inventory: { 5: 1 }, processes: {} },
        };

        const encoded = Buffer.from(JSON.stringify(envelope)).toString('base64');
        await importGameStateString(encoded);
        const loaded = loadGameState();
        expect(loaded).toMatchObject(envelope.payload);
        expect(typeof loaded._meta?.lastUpdated).toBe('number');
    });

    test('importGameStateString accepts plain JSON payloads', async () => {
        const newState = { quests: { bar: true }, inventory: { 5: 1 }, processes: {} };
        await importGameStateString(JSON.stringify(newState));
        const loaded = loadGameState();
        expect(loaded).toMatchObject(newState);
        expect(typeof loaded._meta?.lastUpdated).toBe('number');
    });

    test('validateGameState should fill missing sections', () => {
        const corrupted = { quests: null };
        const validated = validateGameState(corrupted);
        expect(validated).toMatchObject({
            quests: {},
            inventory: {},
            processes: {},
            settings: { showChatDebugPayload: false, showQuestGraphVisualizer: false },
        });
        expect(typeof validated._meta?.lastUpdated).toBe('number');
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

    test('saveGameState persists checksum marker in localStorage', async () => {
        const state = loadGameState();
        state.inventory['checksum-item'] = 2;
        await saveGameState(state);

        const checksum = getGameStateChecksum();
        expect(typeof checksum).toBe('string');
        expect(checksum.length).toBeGreaterThan(0);
        expect(getPersistedGameStateChecksum()).toBe(checksum);
    });

    test('syncGameStateFromLocalIfStale hydrates newer localStorage state', async () => {
        const initial = loadGameState();
        initial.inventory['multi-tab-item'] = 1;
        await saveGameState(initial);

        const localLatest = structuredClone(loadGameState());
        localLatest.inventory['multi-tab-item'] = 7;
        localLatest._meta.checksum = 'force-different-checksum';
        localStorage.setItem('gameState', JSON.stringify(localLatest));
        localStorage.setItem('gameStateChecksum', 'force-different-checksum');

        const changed = syncGameStateFromLocalIfStale(getGameStateChecksum());
        expect(changed).toBe(true);
        expect(loadGameState().inventory['multi-tab-item']).toBe(7);
    });
});
