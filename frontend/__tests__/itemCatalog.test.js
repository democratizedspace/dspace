/**
 * @jest-environment jsdom
 */
import { mergeItems, filterItemsByQuery } from '../src/utils/itemCatalog.js';

describe('itemCatalog utilities', () => {
    test('mergeItems combines built-in and custom items', () => {
        const baseItems = [{ id: 'base-1', name: 'Base Item' }];
        const customItems = [{ id: 'custom-1', name: 'Backflip Device' }];

        expect(mergeItems(baseItems, customItems)).toEqual([
            { id: 'base-1', name: 'Base Item' },
            { id: 'custom-1', name: 'Backflip Device' },
        ]);
    });

    test('filterItemsByQuery finds custom items by name', () => {
        const allItems = [
            { id: 'base-1', name: 'Base Item', description: 'Standard' },
            { id: 'custom-1', name: 'Backflip Device', description: 'Custom gear' },
        ];

        expect(filterItemsByQuery(allItems, 'backflip')).toEqual([
            { id: 'custom-1', name: 'Backflip Device', description: 'Custom gear' },
        ]);
    });
});
