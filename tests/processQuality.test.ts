import { describe, it, expect } from 'vitest';
import processes from '../frontend/src/generated/processes.json' assert { type: 'json' };
import items from '../frontend/src/pages/inventory/json/items';

describe('process quality', () => {
    it('references valid item ids', () => {
        const itemIds = new Set((items as Array<any>).map((i) => i.id));
        for (const proc of processes as Array<any>) {
            for (const list of ['requireItems', 'consumeItems', 'createItems']) {
                for (const entry of proc[list] || []) {
                    expect(itemIds.has(entry.id)).toBe(true);
                }
            }
        }
    });

    it('includes required fields', () => {
        const required = ['id', 'title', 'requireItems', 'consumeItems', 'createItems', 'duration'];
        for (const proc of processes as Array<any>) {
            for (const field of required) {
                expect(proc[field]).not.toBeUndefined();
            }
        }
    });

    it('uses valid container transfer references and allowed itemCounts keys', () => {
        const itemMap = new Map((items as Array<any>).map((item) => [item.id, item]));

        for (const proc of processes as Array<any>) {
            const transfers = Array.isArray(proc.containerItemTransfers)
                ? proc.containerItemTransfers
                : [];

            for (const transfer of transfers) {
                expect(['toContainer', 'toInventory']).toContain(transfer.direction);

                const container = itemMap.get(transfer.containerId);
                const storedItem = itemMap.get(transfer.itemId);

                expect(container).toBeDefined();
                expect(storedItem).toBeDefined();

                const configuredCounts = container?.itemCounts ?? {};
                expect(
                    Object.prototype.hasOwnProperty.call(configuredCounts, transfer.itemId)
                ).toBe(true);

                if (transfer.count === 'all') {
                    expect(transfer.direction).toBe('toInventory');
                } else {
                    expect(typeof transfer.count).toBe('number');
                    expect(transfer.count).toBeGreaterThan(0);
                }
            }
        }
    });
});
