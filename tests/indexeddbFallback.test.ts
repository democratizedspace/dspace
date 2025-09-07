import { expect, test, vi, beforeEach } from 'vitest';

vi.mock(
    'svelte/store',
    () => ({
        writable: () => ({
            set: () => undefined,
            subscribe: () => () => undefined,
            update: () => undefined
        })
    }),
    // @ts-ignore - vitest allows virtual mocks
    { virtual: true }
);

beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    // ensure IndexedDB is unavailable
    // @ts-ignore
    delete globalThis.indexedDB;
    // provide alert spy
    // @ts-ignore
    window.alert = vi.fn();
});

test('falls back to localStorage when IndexedDB unavailable', async () => {
    const common = await import('../frontend/src/utils/gameState/common.js');
    await common.ready;
    const state = common.loadGameState();
    state.inventory['1'] = 1;
    await common.saveGameState(state);
    const stored = JSON.parse(localStorage.getItem('gameState')!);
    expect(stored.inventory['1']).toBe(1);
    expect(common.isUsingLocalStorage()).toBe(true);
    expect((window.alert as any)).toHaveBeenCalled();
});

test('v2 to v3 migration keeps legacy data when IndexedDB fails', async () => {
    localStorage.setItem('gameState', JSON.stringify({ quests: {}, inventory: { a: 1 }, processes: {} }));
    const gs = await import('../frontend/src/utils/gameState.js');
    await gs.importV2V3();
    expect(localStorage.getItem('gameState')).toBeTruthy();
});
