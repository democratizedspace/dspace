import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import items from '../src/pages/inventory/json/items';
import { createItem, createProcess, getProcess } from '../src/utils/customcontent.js';

describe('custom processes', () => {
    it('accept built-in and custom item references together', async () => {
        const builtInItemId = items[0]?.id ?? 'built-in-item-id';
        const customItemId = await createItem('Custom Alloy', 'Used for mixed crafting flows');

        const id = await createProcess(
            'Mixed Sources',
            '45m',
            [{ id: builtInItemId, count: 1 }],
            [{ id: customItemId, count: 2 }],
            [{ id: builtInItemId, count: 1 }]
        );

        const process = await getProcess(id);
        expect(process.requireItems).toEqual([{ id: builtInItemId, count: 1 }]);
        expect(process.consumeItems).toEqual([{ id: customItemId, count: 2 }]);
        expect(process.createItems).toEqual([{ id: builtInItemId, count: 1 }]);
    });
});
