import { describe, expect, it } from 'vitest';
import items from '../frontend/src/pages/inventory/json/items';

describe('item container catalog validation', () => {
    const itemIds = new Set((items as Array<Record<string, any>>).map((item) => item.id));

    it('uses only valid item ids for itemCounts keys', () => {
        for (const item of items as Array<Record<string, any>>) {
            if (!item.itemCounts || typeof item.itemCounts !== 'object') {
                continue;
            }

            for (const storedItemId of Object.keys(item.itemCounts)) {
                expect(itemIds.has(storedItemId)).toBe(true);
            }
        }
    });

    it('uses zero defaults for all itemCounts values', () => {
        for (const item of items as Array<Record<string, any>>) {
            if (!item.itemCounts || typeof item.itemCounts !== 'object') {
                continue;
            }

            for (const count of Object.values(item.itemCounts)) {
                expect(count).toBe(0);
            }
        }
    });
});
