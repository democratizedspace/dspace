import { describe, expect, test } from 'vitest';
import { filterItemsByQuery, getMergedItems } from '../src/utils/itemCatalog.js';

describe('item catalog helpers', () => {
    test('merges built-in and custom items and finds custom items by search', async () => {
        const baseItems = [{ id: 'base-1', name: 'Base Item', description: 'Built-in item.' }];
        const customItems = [
            { id: 'custom-1', name: 'Backflip Device', description: 'Custom item.' },
        ];

        const mergedItems = await getMergedItems({ baseItems, customItems });

        expect(mergedItems).toHaveLength(2);
        expect(mergedItems.map((item) => item.id)).toEqual(['base-1', 'custom-1']);

        const searchResults = filterItemsByQuery(mergedItems, 'backflip');
        expect(searchResults).toHaveLength(1);
        expect(searchResults[0]?.id).toBe('custom-1');
    });
});
