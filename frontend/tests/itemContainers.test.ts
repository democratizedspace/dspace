import { describe, expect, test } from 'vitest';
import items from '../src/pages/inventory/json/items';
import processes from '../src/generated/processes.json';

const itemMap = new Map(items.map((item) => [item.id, item]));

describe('item container definitions', () => {
    test('only reference known item IDs in itemCounts templates', () => {
        for (const item of items) {
            if (!item.itemCounts) {
                continue;
            }

            for (const [containedItemId, count] of Object.entries(item.itemCounts)) {
                expect(itemMap.has(containedItemId)).toBe(true);
                expect(typeof count).toBe('number');
                expect(Number.isFinite(count)).toBe(true);
                expect(count).toBeGreaterThanOrEqual(0);
            }
        }
    });

    test('process container actions only target declared itemCounts keys', () => {
        for (const process of processes) {
            const actions = [...(process.storeItems ?? []), ...(process.releaseItems ?? [])];

            for (const action of actions) {
                const container = itemMap.get(action.containerId);
                expect(container).toBeTruthy();
                expect(container?.itemCounts).toBeTruthy();
                expect(Object.hasOwn(container?.itemCounts ?? {}, action.itemId)).toBe(true);
            }
        }
    });
});
