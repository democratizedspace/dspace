import 'fake-indexeddb/auto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import items from '../src/pages/inventory/json/items';
import { db } from '../src/utils/customcontent.js';
import {
    getItemById,
    getItemMap,
    getCachedItemById,
    resetItemResolverCache,
} from '../src/utils/itemResolver.js';

const deleteDatabase = (name) =>
    new Promise((resolve) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
        request.onblocked = () => resolve();
    });

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

beforeAll(() => {
    URL.createObjectURL = vi.fn(() => 'blob:custom-item');
    URL.revokeObjectURL = vi.fn();
});

afterAll(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
});

beforeEach(async () => {
    await deleteDatabase('CustomContent');
    resetItemResolverCache();
});

describe('itemResolver', () => {
    it('returns built-in items from the static catalog', async () => {
        const builtIn = items[0];
        const resolved = await getItemById(builtIn.id);

        expect(resolved).not.toBeNull();
        expect(resolved.name).toBe(builtIn.name);
        expect(resolved.image).toBe(builtIn.image);
    });

    it('returns custom items from IndexedDB with resolved images', async () => {
        const customItem = {
            id: 'custom-item-id',
            name: 'foobar',
            description: 'foo bar baz',
            image: null,
            imageBlob: new Blob(['custom'], { type: 'image/png' }),
        };

        await db.items.add(customItem);

        const resolved = await getItemById(customItem.id);

        expect(resolved).not.toBeNull();
        expect(resolved.name).toBe(customItem.name);
        expect(resolved.image).toBe('blob:custom-item');
    });

    it('returns null when the item is missing', async () => {
        const resolved = await getItemById('missing-item-id');
        expect(resolved).toBeNull();
    });

    it('builds an item map for mixed ids', async () => {
        const builtIn = items[0];
        const customItem = {
            id: 'custom-item-map-id',
            name: 'custom-map',
            description: 'map description',
            image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEElEQVR4nGP8/58BAwMDAwMAAAUABW6pL9cAAAAASUVORK5CYII=',
        };

        await db.items.add(customItem);

        const map = await getItemMap([builtIn.id, customItem.id, 'missing']);

        expect(map.get(String(builtIn.id))?.name).toBe(builtIn.name);
        expect(map.get(customItem.id)?.name).toBe(customItem.name);
        expect(map.has('missing')).toBe(false);
        expect(getCachedItemById(customItem.id)).not.toBeNull();
    });
});
