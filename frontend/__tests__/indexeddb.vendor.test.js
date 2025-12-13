/**
 * @jest-environment jsdom
 */
import 'fake-indexeddb/auto';
import { FDBFactory } from 'fake-indexeddb';

test('falls back to vendor-prefixed IndexedDB implementation', async () => {
    const original = globalThis.indexedDB;
    // Remove standard implementation
    delete globalThis.indexedDB;
    globalThis.webkitIndexedDB = new FDBFactory();

    const { addEntity, getEntity } = await import('../src/utils/indexeddb.js');
    const entity = { title: 'Vendor Test', description: 'Prefixed IDB' };
    const id = await addEntity(entity);
    const retrieved = await getEntity(id);
    expect(retrieved).toMatchObject({ id, ...entity });

    // Cleanup
    delete globalThis.webkitIndexedDB;
    globalThis.indexedDB = original;
});
