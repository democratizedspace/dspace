import { beforeEach, describe, expect, it, vi } from 'vitest';
import 'fake-indexeddb/auto';
import items from '../src/pages/inventory/json/items/index.js';
import { db } from '../src/utils/customcontent.js';
import {
    getItemById,
    releaseItemImages,
    resetItemResolverCache,
    retainItemImages,
} from '../src/utils/itemResolver.js';

const CUSTOM_DB_NAME = 'CustomContent';
const CUSTOM_DB_VERSION = 3;

async function clearCustomContentItems() {
    const request = indexedDB.open(CUSTOM_DB_NAME, CUSTOM_DB_VERSION);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
        request.onupgradeneeded = () => {
            const upgradeDb = request.result;
            if (!upgradeDb.objectStoreNames.contains('meta')) {
                const metaStore = upgradeDb.createObjectStore('meta');
                metaStore.put(CUSTOM_DB_VERSION, 'schemaVersion');
            }
            if (!upgradeDb.objectStoreNames.contains('items')) {
                upgradeDb.createObjectStore('items', { keyPath: 'id' });
            }
            if (!upgradeDb.objectStoreNames.contains('processes')) {
                upgradeDb.createObjectStore('processes', { keyPath: 'id' });
            }
            if (!upgradeDb.objectStoreNames.contains('quests')) {
                upgradeDb.createObjectStore('quests', { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    try {
        if (!db.objectStoreNames.contains('items')) {
            return;
        }
        const tx = db.transaction('items', 'readwrite');
        tx.objectStore('items').clear();
        await new Promise<void>((resolve) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
            tx.onabort = () => resolve();
        });
    } finally {
        db.close();
    }
}

describe('itemResolver', () => {
    beforeEach(async () => {
        resetItemResolverCache();
        await clearCustomContentItems();
    });

    it('returns built-in item metadata', async () => {
        const builtIn = items[0];
        const resolved = await getItemById(builtIn.id);

        expect(resolved).not.toBeNull();
        expect(resolved?.name).toBe(builtIn.name);
        expect(resolved?.image).toBe(builtIn.image);
    });

    it('returns custom item metadata from IndexedDB', async () => {
        const customId = 'custom-item-foobar';
        await db.items.add({
            id: customId,
            name: 'foobar',
            description: 'foo bar baz',
            image: 'data:image/png;base64,Zm9v',
        });

        const resolved = await getItemById(customId);

        expect(resolved).not.toBeNull();
        expect(resolved?.name).toBe('foobar');
        expect(resolved?.image).toBe('data:image/png;base64,Zm9v');
    });

    it('returns null for missing items', async () => {
        const resolved = await getItemById('missing-item');
        expect(resolved).toBeNull();
    });

    it('creates and releases object URLs for blob images', async () => {
        const customId = 'custom-item-blob';
        const blob = new Blob(['foo'], { type: 'image/png' });
        const createObjectUrl = vi.fn(() => 'blob:custom-item');
        const revokeObjectUrl = vi.fn();
        const dbGetSpy = vi.spyOn(db, 'get').mockResolvedValue({
            id: customId,
            name: 'blob item',
            description: 'custom item with blob',
            image: blob,
        });

        Object.defineProperty(globalThis, 'URL', {
            value: {
                createObjectURL: createObjectUrl,
                revokeObjectURL: revokeObjectUrl,
            },
            writable: true,
        });

        const resolved = await getItemById(customId);
        expect(resolved?.image).toBe('blob:custom-item');
        expect(createObjectUrl).toHaveBeenCalledWith(blob);

        retainItemImages([customId]);
        releaseItemImages([customId]);
        expect(revokeObjectUrl).toHaveBeenCalledWith('blob:custom-item');
        dbGetSpy.mockRestore();
    });
});
