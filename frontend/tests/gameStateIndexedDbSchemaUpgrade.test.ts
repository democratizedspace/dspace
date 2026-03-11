import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const DB_NAME = 'dspaceGameState';

const deleteDb = async () =>
    await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(DB_NAME);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        request.onblocked = () => resolve();
    });

const seedLegacyVersionOneDb = async () =>
    await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('state')) {
                db.createObjectStore('state');
            }
            if (!db.objectStoreNames.contains('backup')) {
                db.createObjectStore('backup');
            }
        };
        request.onsuccess = () => {
            request.result.close();
            resolve();
        };
        request.onerror = () => reject(request.error);
    });

const readMetaSnapshot = async () =>
    await new Promise<Record<string, unknown> | undefined>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 2);
        request.onsuccess = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('meta')) {
                db.close();
                resolve(undefined);
                return;
            }

            const tx = db.transaction('meta', 'readonly');
            const getRequest = tx.objectStore('meta').get('root');
            getRequest.onsuccess = () => {
                const value = getRequest.result as Record<string, unknown> | undefined;
                db.close();
                resolve(value);
            };
            getRequest.onerror = () => reject(getRequest.error);
        };
        request.onerror = () => reject(request.error);
    });

describe('gameState IndexedDB schema upgrade', () => {
    let alertSpy: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        vi.resetModules();
        localStorage.clear();
        await deleteDb();
        await seedLegacyVersionOneDb();
        alertSpy = vi.fn();
        window.alert = alertSpy;
    });

    afterEach(async () => {
        const common = await import('../src/utils/gameState/common.js');
        await common.closeGameStateDatabaseForTesting();
        await deleteDb();
        localStorage.clear();
    });

    test('upgrades legacy v1 DB and keeps IndexedDB as primary persistence', async () => {
        const common = await import('../src/utils/gameState/common.js');

        await common.ready;

        expect(common.isUsingLocalStorage()).toBe(false);
        expect(alertSpy).not.toHaveBeenCalled();

        const state = common.loadGameState();
        state.inventory['schema-upgrade-check'] = 1;
        await common.saveGameState(state);

        const metaSnapshot = await readMetaSnapshot();
        expect(metaSnapshot).toBeDefined();
        expect(typeof metaSnapshot?.checksum).toBe('string');
        expect(Number(metaSnapshot?.lastUpdated)).toBeGreaterThan(0);
    });
});
