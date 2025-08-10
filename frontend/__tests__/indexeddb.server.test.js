/**
 * @jest-environment node
 */
import { vi } from 'vitest';

test('getItems returns empty array when IndexedDB unsupported', async () => {
    const original = globalThis.indexedDB;
    delete globalThis.indexedDB;
    vi.resetModules();
    const { getItems } = await import('../src/utils/indexeddb.js');
    const items = await getItems();
    expect(items).toEqual([]);
    globalThis.indexedDB = original;
});
