import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, test } from 'vitest';
import {
    getGameStateChecksum,
    getPersistedGameStateChecksum,
    loadGameState,
    resetGameState,
    saveGameState,
    syncGameStateFromLocalIfStale,
} from '../src/utils/gameState/common.js';

describe('game state checksum sync', () => {
    beforeEach(async () => {
        await resetGameState();
    });

    test('saveGameState writes checksum marker', async () => {
        const state = loadGameState();
        state.inventory['checksum-item'] = 3;
        await saveGameState(state);

        const checksum = getGameStateChecksum();
        expect(checksum.length).toBeGreaterThan(0);
        expect(getPersistedGameStateChecksum()).toBe(checksum);
    });

    test('syncGameStateFromLocalIfStale hydrates local updates', async () => {
        const state = loadGameState();
        state.inventory['multi-tab-item'] = 1;
        await saveGameState(state);

        const newer = structuredClone(loadGameState());
        newer.inventory['multi-tab-item'] = 8;
        newer._meta.checksum = 'forced-tab-checksum';

        localStorage.setItem('gameState', JSON.stringify(newer));
        localStorage.setItem('gameStateChecksum', newer._meta.checksum);

        const changed = syncGameStateFromLocalIfStale(getGameStateChecksum());
        expect(changed).toBe(true);
        expect(loadGameState().inventory['multi-tab-item']).toBe(8);
    });
});
