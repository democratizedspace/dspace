import { vi, expect, test } from 'vitest';

const originalIndexedDB = global.indexedDB;

test('falls back to localStorage with warning when IndexedDB is unavailable', async () => {
    delete global.indexedDB;
    const store = {};
    global.localStorage = {
        getItem: (k) => store[k] || null,
        setItem: (k, v) => {
            store[k] = v;
        },
        removeItem: (k) => {
            delete store[k];
        },
    };
    const alert = vi.fn();
    const originalAlert = window.alert;
    window.alert = alert;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { loadGameState, saveGameState, ready } = await import(
        '../../src/utils/gameState/common.js'
    );
    await ready;
    const state = loadGameState();
    state.inventory['1'] = 2;
    const ok = await saveGameState(state);
    expect(ok).toBe(true);
    expect(JSON.parse(store['gameState_v3']).inventory['1']).toBe(2);
    expect(alert).toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
    window.alert = originalAlert;
    delete global.localStorage;
    if (originalIndexedDB) {
        global.indexedDB = originalIndexedDB;
    }
});
