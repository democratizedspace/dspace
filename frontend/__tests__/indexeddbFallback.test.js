import { beforeEach, afterEach, expect, test, vi } from 'vitest';

const originalIndexedDB = globalThis.indexedDB;

beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    // ensure IndexedDB is unavailable
    // @ts-expect-error: deliberately remove IndexedDB to test fallback
    delete globalThis.indexedDB;
    window.alert = vi.fn();
});

afterEach(() => {
    globalThis.indexedDB = originalIndexedDB;
});

test('falls back to localStorage when IndexedDB unavailable', async () => {
    const common = await import('../src/utils/gameState/common.js');
    await common.ready;
    const state = common.loadGameState();
    state.inventory['1'] = 1;
    await common.saveGameState(state);
    const stored = JSON.parse(localStorage.getItem('gameState'));
    expect(stored.inventory['1']).toBe(1);
    expect(common.isUsingLocalStorage()).toBe(true);
    expect(window.alert).toHaveBeenCalled();
});

test('v2 to v3 migration keeps legacy data when IndexedDB fails', async () => {
    localStorage.setItem(
        'gameState',
        JSON.stringify({ quests: {}, inventory: { a: 1 }, processes: {} })
    );
    const gs = await import('../src/utils/gameState.js');
    await gs.importV2V3();
    expect(localStorage.getItem('gameState')).toBeTruthy();
});
