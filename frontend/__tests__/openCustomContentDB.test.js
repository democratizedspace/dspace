/**
 * @jest-environment jsdom
 */
import { openCustomContentDB } from '../src/utils/indexeddb.js';
import * as migrations from '../src/utils/migrations.js';

describe('openCustomContentDB', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });
    test('creates stores and resolves with db on success', async () => {
        jest.spyOn(migrations, 'runMigrations').mockResolvedValue();
        const db = {
            objectStoreNames: { contains: jest.fn().mockReturnValue(false) },
            createObjectStore: jest.fn(),
        };
        const request = {
            onupgradeneeded: null,
            onsuccess: null,
            onerror: null,
            result: db,
            transaction: { objectStore: jest.fn(() => ({ put: jest.fn() })) },
        };
        global.indexedDB.open = jest.fn(() => request);

        const promise = openCustomContentDB();
        // trigger upgrade and success
        request.onupgradeneeded({ target: { result: db } });
        request.onsuccess();

        const resultDb = await promise;
        expect(resultDb).toBe(db);
        expect(db.createObjectStore).toHaveBeenCalledWith('items', { keyPath: 'id' });
        expect(db.createObjectStore).toHaveBeenCalledWith('processes', { keyPath: 'id' });
        expect(db.createObjectStore).toHaveBeenCalledWith('quests', { keyPath: 'id' });
    });

    test('rejects on error', async () => {
        const request = {
            onupgradeneeded: null,
            onsuccess: null,
            onerror: null,
            error: new Error('fail'),
            transaction: { objectStore: jest.fn(() => ({ put: jest.fn() })) },
        };
        global.indexedDB.open = jest.fn(() => request);

        const promise = openCustomContentDB();
        request.onerror();

        await expect(promise).rejects.toBe(request.error);
    });
});
