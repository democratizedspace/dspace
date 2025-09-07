/**
 * @jest-environment jsdom
 */
import { vi } from 'vitest';

describe('game state storage fallback', () => {
    beforeEach(() => {
        vi.resetModules();
        localStorage.clear();
    });

    test('falls back to localStorage when IndexedDB is unavailable', async () => {
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
        // @ts-expect-error - simulate missing IndexedDB
        delete global.indexedDB;
        const module = await import('../../src/utils/gameState/common.js');
        const state = module.loadGameState();
        state.inventory.item = 1;
        const ok = await module.saveGameState(state);
        expect(ok).toBe(true);
        const stored = JSON.parse(localStorage.getItem('gameState'));
        expect(stored.inventory.item).toBe(1);
        expect(alertSpy).toHaveBeenCalled();
        alertSpy.mockRestore();
    });
});
