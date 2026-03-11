import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const DB_NAME = 'dspaceGameState';

const createLegacyVersionOneDb = async () => {
    await new Promise<void>((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
        deleteRequest.onblocked = () => resolve();
    });

    await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = () => {
            const db = request.result;
            db.createObjectStore('state');
            db.createObjectStore('backup');
        };

        request.onsuccess = () => {
            request.result.close();
            resolve();
        };

        request.onerror = () => reject(request.error);
    });
};

describe('game state IndexedDB schema migration', () => {
    beforeEach(async () => {
        vi.resetModules();
        localStorage.clear();
        await createLegacyVersionOneDb();
        window.alert = vi.fn();
    });

    test('upgrades v1 databases and keeps IndexedDB enabled', async () => {
        const common = await import('../src/utils/gameState/common.js');

        await common.ready;

        expect(common.isUsingLocalStorage()).toBe(false);
        expect(window.alert).not.toHaveBeenCalled();

        const state = common.loadGameState();
        state.inventory['idb-upgrade-check'] = 1;
        await common.saveGameState(state);

        expect(common.isUsingLocalStorage()).toBe(false);

        const lightweight = await common.getPersistedGameStateLightweight();
        expect(lightweight.checksum.length).toBeGreaterThan(0);
    });
});
