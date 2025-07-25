/**
 * @jest-environment jsdom
 */
import 'fake-indexeddb/auto';
import { jest } from '@jest/globals';

// We import inside each test after resetting modules to ensure a fresh dbInstance

describe('IndexedDB error handling', () => {
    const originalOpen = global.indexedDB.open;

    beforeEach(() => {
        jest.resetModules();
    });

    afterEach(() => {
        global.indexedDB.open = originalOpen;
        jest.restoreAllMocks();
    });

    test('addEntity rejects when opening DB fails', async () => {
        const error = new Error('open fail');
        const request = { onsuccess: null, onerror: null, onupgradeneeded: null };
        global.indexedDB.open = jest.fn(() => request);
        const { addEntity } = await import('../src/utils/indexeddb.js');
        const promise = addEntity({ name: 'fail' });
        request.onerror({ target: { error } });
        await expect(promise).rejects.toBe(error);
    });

    test('getEntity rejects on get error', async () => {
        const openReq = { onsuccess: null, onerror: null, onupgradeneeded: null };
        const getReq = {};
        const store = { get: jest.fn(() => getReq) };
        const transaction = { objectStore: jest.fn(() => store) };
        const db = { transaction: jest.fn(() => transaction) };
        global.indexedDB.open = jest.fn(() => openReq);
        const { getEntity } = await import('../src/utils/indexeddb.js');
        const promise = getEntity(1);
        openReq.onsuccess({ target: { result: db } });
        await Promise.resolve();
        await Promise.resolve();
        const error = new Error('get fail');
        getReq.onerror({ target: { error } });
        await expect(promise).rejects.toBe(error);
    });

    test('updateEntity rejects when entity missing', async () => {
        const { updateEntity } = await import('../src/utils/indexeddb.js');
        await expect(updateEntity({ id: 999, title: 'x' })).rejects.toThrow('Entity not found');
    });

    test('deleteEntity rejects on delete error', async () => {
        const openReq = { onsuccess: null, onerror: null, onupgradeneeded: null };
        const delReq = {};
        const store = { delete: jest.fn(() => delReq) };
        const transaction = { objectStore: jest.fn(() => store) };
        const db = { transaction: jest.fn(() => transaction) };
        global.indexedDB.open = jest.fn(() => openReq);
        const { deleteEntity } = await import('../src/utils/indexeddb.js');
        const promise = deleteEntity(1);
        openReq.onsuccess({ target: { result: db } });
        await Promise.resolve();
        await Promise.resolve();
        const error = new Error('delete fail');
        delReq.onerror({ target: { error } });
        await expect(promise).rejects.toBe(error);
    });

    test('custom content functions propagate open errors', async () => {
        const module = await import('../src/utils/indexeddb.js');
        const error = new Error('fail');
        async function expectFailure(fn) {
            const req = { onupgradeneeded: null, onsuccess: null, onerror: null };
            global.indexedDB.open = jest.fn(() => req);
            const promise = fn();
            await Promise.resolve();
            await Promise.resolve();
            req.error = error;
            req.onerror();
            await expect(promise).rejects.toBe(error);
        }

        await expectFailure(() => module.saveItem({ id: '1' }));
        await expectFailure(() => module.getItems());
        await expectFailure(() => module.getItem('x'));
        await expectFailure(() => module.saveProcess({ id: 'p' }));
        await expectFailure(() => module.getProcesses());
        await expectFailure(() => module.getProcess('x'));
        await expectFailure(() => module.deleteProcess('x'));
        await expectFailure(() => module.saveQuest({ id: 'q' }));
        await expectFailure(() => module.getQuests());
        await expectFailure(() => module.getQuest('x'));
    });

    // Suppress unhandled rejections from causing Jest failures
    process.on('unhandledRejection', (reason) => {
        console.error(reason);
    });
});
