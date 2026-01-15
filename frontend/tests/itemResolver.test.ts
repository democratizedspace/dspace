import { describe, expect, test, beforeEach, vi } from 'vitest';
import items from '../src/pages/inventory/json/items';
import { db } from '../src/utils/customcontent.js';
import {
    getItemById,
    getItemMap,
    releaseItemImageUrls,
    resetItemResolverCache,
} from '../src/utils/itemResolver.js';

const deleteCustomContentDb = async () =>
    new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase('CustomContent');
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
        request.onblocked = () => resolve();
    });

describe('itemResolver', () => {
    beforeEach(async () => {
        resetItemResolverCache();
        await deleteCustomContentDb();
    });

    test('returns built-in item metadata by id', async () => {
        const builtInItem = items[0];

        const resolved = await getItemById(builtInItem.id);

        expect(resolved).not.toBeNull();
        expect(resolved?.name).toBe(builtInItem.name);
        expect(resolved?.image).toBe(builtInItem.image);
    });

    test('returns custom item metadata with data url image', async () => {
        const customId = 'custom-item-foobar';
        const payload = {
            id: customId,
            name: 'foobar',
            description: 'foo bar baz',
            image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB',
        };

        await db.items.add(payload);

        const resolved = await getItemById(customId);

        expect(resolved).not.toBeNull();
        expect(resolved?.name).toBe('foobar');
        expect(resolved?.image).toBe(payload.image);
    });

    test('returns custom item metadata with blob image and releases urls', async () => {
        const customId = 'custom-item-blob';
        const blob = new Blob(['blob'], { type: 'image/png' });
        const createObjectUrl = vi.fn(() => 'blob:custom-item');
        const revokeObjectUrl = vi.fn();
        const originalCreateObjectUrl = URL.createObjectURL;
        const originalRevokeObjectUrl = URL.revokeObjectURL;
        Object.defineProperty(URL, 'createObjectURL', {
            value: createObjectUrl,
            configurable: true,
        });
        Object.defineProperty(URL, 'revokeObjectURL', {
            value: revokeObjectUrl,
            configurable: true,
        });

        await db.items.add({
            id: customId,
            name: 'blob item',
            description: 'blob description',
            imageBlob: blob,
        });

        const resolved = await getItemById(customId);

        expect(resolved?.image).toBe('blob:custom-item');
        expect(createObjectUrl).toHaveBeenCalledWith(blob);

        releaseItemImageUrls([customId]);
        expect(revokeObjectUrl).toHaveBeenCalledWith('blob:custom-item');

        Object.defineProperty(URL, 'createObjectURL', {
            value: originalCreateObjectUrl,
            configurable: true,
        });
        Object.defineProperty(URL, 'revokeObjectURL', {
            value: originalRevokeObjectUrl,
            configurable: true,
        });
    });

    test('getItemMap returns a map for requested ids', async () => {
        const customId = 'custom-item-map';
        await db.items.add({
            id: customId,
            name: 'map item',
            description: 'map description',
            image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB',
        });

        const map = await getItemMap([customId]);

        expect(map.get(customId)?.name).toBe('map item');
    });

    test('missing item ids return null', async () => {
        const resolved = await getItemById('missing-id');

        expect(resolved).toBeNull();
    });
});
