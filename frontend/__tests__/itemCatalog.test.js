import { filterItemsByQuery, mergeItemLists } from '../src/utils/itemCatalog.js';

describe('itemCatalog utilities', () => {
    test('merges built-in and custom items and finds custom entries by name', () => {
        const builtInItems = [
            { id: 'built-1', name: 'Solar Panel', description: 'Power' },
        ];
        const customItems = [
            { id: 'custom-1', name: 'Backflip Device', description: 'Does flips' },
        ];

        const mergedItems = mergeItemLists(builtInItems, customItems);

        expect(mergedItems).toHaveLength(2);
        expect(mergedItems).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: 'built-1' }),
                expect.objectContaining({ id: 'custom-1' }),
            ])
        );

        const filteredItems = filterItemsByQuery(mergedItems, 'backflip');
        expect(filteredItems).toEqual([
            expect.objectContaining({ id: 'custom-1', name: 'Backflip Device' }),
        ]);
    });
});
