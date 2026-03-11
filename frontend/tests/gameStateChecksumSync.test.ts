import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, test } from 'vitest';
import {
    getGameStateChecksum,
    getPersistedGameStateChecksum,
    getPersistedGameStateLightweight,
    loadGameState,
    resetGameState,
    saveGameState,
    syncGameStateFromLocalIfStale,
} from '../src/utils/gameState/common.js';

const clearIndexedDbMetaStore = async () => {
    await new Promise((resolve, reject) => {
        const request = indexedDB.open('dspaceGameState');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction('meta', 'readwrite');
            tx.objectStore('meta').clear();
            tx.oncomplete = () => {
                db.close();
                resolve(undefined);
            };
            tx.onerror = () => reject(tx.error);
        };
    });
};

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
        localStorage.setItem(
            'gameStateLite',
            JSON.stringify({ checksum: newer._meta.checksum, dUSD: 492 })
        );
        localStorage.setItem('gameStateChecksum', newer._meta.checksum);

        const changed = syncGameStateFromLocalIfStale(getGameStateChecksum());
        expect(changed).toBe(true);
        expect(loadGameState().inventory['multi-tab-item']).toBe(8);
    });

    test('reads checksum from IndexedDB lightweight snapshot before localStorage fallback', async () => {
        const state = loadGameState();
        state.inventory['checksum-item'] = 4;
        await saveGameState(state);

        const idbLightweight = await getPersistedGameStateLightweight();
        expect(idbLightweight.checksum).toBe(getGameStateChecksum());

        localStorage.setItem(
            'gameStateLite',
            JSON.stringify({ checksum: 'fallback-lite', dUSD: 0 })
        );
        localStorage.setItem('gameStateChecksum', 'fallback-checksum');

        const stillPrefersIdb = await getPersistedGameStateLightweight();
        expect(stillPrefersIdb.checksum).toBe(idbLightweight.checksum);
    });

    test('falls back to localStorage checksum marker when lightweight snapshot is unavailable', async () => {
        await clearIndexedDbMetaStore();
        localStorage.removeItem('gameStateLite');
        localStorage.setItem('gameStateChecksum', 'legacy-checksum');

        const lightweight = await getPersistedGameStateLightweight();
        expect(lightweight.checksum).toBe('legacy-checksum');
    });
});
