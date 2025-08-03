/**
 * @jest-environment jsdom
 */
import 'fake-indexeddb/auto';
import { db, updateQuest, deleteItem, ENTITY_TYPES } from '../src/utils/customcontent.js';
import { saveItem } from '../src/utils/indexeddb.js';

describe('customcontent extra coverage', () => {
    test('update and delete handle missing entities', async () => {
        await expect(updateQuest(9999, { title: 'none' })).rejects.toThrow(
            'quest not found with id: 9999'
        );
        await expect(deleteItem('missing')).rejects.toThrow('item not found with id: missing');
    });

    test('list returns arrays and unknown type throws', async () => {
        const quests = await db.list(ENTITY_TYPES.QUEST);
        const items = await db.list(ENTITY_TYPES.ITEM);
        const processes = await db.list(ENTITY_TYPES.PROCESS);
        expect(Array.isArray(quests)).toBe(true);
        expect(Array.isArray(items)).toBe(true);
        expect(Array.isArray(processes)).toBe(true);
        await expect(db.list('unknown')).rejects.toThrow('Unknown entity type: unknown');
    });

    test('query filters entities', async () => {
        const cheap = { id: 'cheap', name: 'cheap', price: 1 };
        const expensive = { id: 'expensive', name: 'expensive', price: 100 };
        await saveItem(cheap);
        await saveItem(expensive);
        const results = await db.query(ENTITY_TYPES.ITEM, (item) => Number(item.price) > 50);
        expect(results.map((r) => r.id)).toEqual(['expensive']);
    });
});
