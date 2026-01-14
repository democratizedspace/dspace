/**
 * @jest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';

const builtinItems = [
    { id: 'iron', name: 'Iron' },
    { id: 'copper', name: 'Copper' },
];

const customItems = [{ id: 'custom-backflip', name: 'Backflip Device' }];

jest.mock('../src/pages/inventory/json/items', () => builtinItems, { virtual: true });

jest.mock('../src/utils/customcontent.js', () => ({
    ENTITY_TYPES: { ITEM: 'item' },
    db: {
        list: jest.fn(),
    },
}));

import { db, ENTITY_TYPES } from '../src/utils/customcontent.js';
import { filterItemsByQuery, getMergedItems } from '../src/utils/itemCatalog.js';

describe('item catalog helpers', () => {
    beforeEach(() => {
        db.list.mockReset();
    });

    it('merges built-in and custom items', async () => {
        db.list.mockResolvedValue(customItems);

        const merged = await getMergedItems();

        expect(merged).toHaveLength(3);
        expect(merged).toEqual(expect.arrayContaining(builtinItems));
        expect(merged).toEqual(expect.arrayContaining(customItems));
        expect(db.list).toHaveBeenCalledWith(ENTITY_TYPES.ITEM);
    });

    it('filters items by query including custom entries', () => {
        const merged = [...builtinItems, ...customItems];
        const results = filterItemsByQuery(merged, 'backflip');

        expect(results).toEqual([customItems[0]]);
    });
});
