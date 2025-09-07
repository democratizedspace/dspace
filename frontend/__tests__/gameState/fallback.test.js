import { expect, test, vi } from 'vitest';

// This test intentionally runs without fake-indexeddb to simulate browsers
// where IndexedDB is unavailable (e.g. Safari private mode).
test('falls back to localStorage when IndexedDB is unavailable', async () => {
    const alertMock = vi.fn();
    // @ts-expect-error - attach alert for the module under test
    global.alert = alertMock;
    // Ensure indexedDB is not defined before requiring the module
    // @ts-expect-error - remove polyfill
    delete global.indexedDB;

    const { loadGameState, saveGameState } = await import('../../src/utils/gameState/common.js');
    const state = loadGameState();
    state.inventory['1'] = 7;
    await saveGameState(state);

    const stored = JSON.parse(localStorage.getItem('gameState'));
    expect(stored.inventory['1']).toBe(7);
    expect(alertMock).toHaveBeenCalled();
});
