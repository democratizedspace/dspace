import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import items from '../src/pages/inventory/json/items';
import { db } from '../src/utils/customcontent.js';
import { clearItemResolverCache, getItemById, getItemMap } from '../src/utils/itemResolver.js';

const TEST_IMAGE =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';

async function deleteCustomContentDb() {
    await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase('CustomContent');
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
        request.onblocked = () => resolve();
    });
}

afterEach(async () => {
    clearItemResolverCache();
    await deleteCustomContentDb();
});

describe('itemResolver', () => {
    it('resolves a built-in item by id', async () => {
        const builtIn = items[0];
        const resolved = await getItemById(builtIn.id);

        expect(resolved).not.toBeNull();
        expect(resolved?.name).toBe(builtIn.name);
        expect(resolved?.image).toBe(builtIn.image);
    });

    it('resolves a custom item by id', async () => {
        const customId = 'custom-item-123';

        await db.items.add({
            id: customId,
            name: 'foobar',
            description: 'foo bar baz',
            image: TEST_IMAGE,
        });

        const resolved = await getItemById(customId);

        expect(resolved).not.toBeNull();
        expect(resolved?.name).toBe('foobar');
        expect(resolved?.image).toBe(TEST_IMAGE);
    });

    it('returns null for missing items', async () => {
        const resolved = await getItemById('missing-item');
        const map = await getItemMap(['missing-item']);

        expect(resolved).toBeNull();
        expect(map.get('missing-item')?.missing).toBe(true);
    });
});
