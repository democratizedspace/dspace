import { describe, expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';

const itemsDir = path.join(__dirname, '../../frontend/src/pages/inventory/json/items');
const processesPath = path.join(__dirname, '../../frontend/src/pages/processes/base.json');

type ItemDef = { id: string; itemCounts?: Record<string, number> };

type ItemCountOperation = {
    operation: 'deposit' | 'withdraw' | 'withdraw-all';
    containerItemId: string;
    itemId: string;
    count?: number;
};

function loadItems(): ItemDef[] {
    return fs
        .readdirSync(itemsDir)
        .filter((name) => name.endsWith('.json'))
        .flatMap((name) => {
            const data = JSON.parse(fs.readFileSync(path.join(itemsDir, name), 'utf8'));
            return Array.isArray(data) ? data : [];
        });
}

describe('item container catalog and process validation', () => {
    const items = loadItems();
    const itemIds = new Set(items.map((item) => item.id));
    const containerMap = new Map(
        items.map((item) => [item.id, item.itemCounts && typeof item.itemCounts === 'object' ? item.itemCounts : {}])
    );

    test('itemCounts keys reference valid item ids and defaults are zero', () => {
        const failures: string[] = [];

        for (const item of items) {
            if (!item.itemCounts || typeof item.itemCounts !== 'object') {
                continue;
            }

            for (const [storedItemId, defaultCount] of Object.entries(item.itemCounts)) {
                if (!itemIds.has(storedItemId)) {
                    failures.push(`${item.id} itemCounts key ${storedItemId} is not a valid item id`);
                }
                if (defaultCount !== 0) {
                    failures.push(`${item.id} itemCounts.${storedItemId} default must be 0`);
                }
            }
        }

        expect(failures).toEqual([]);
    });

    test('itemCountOperations only reference allowed container/item pairs', () => {
        const processes = JSON.parse(fs.readFileSync(processesPath, 'utf8')) as Array<{
            id: string;
            itemCountOperations?: ItemCountOperation[];
        }>;

        const failures: string[] = [];

        for (const process of processes) {
            for (const operation of process.itemCountOperations ?? []) {
                const allowed = containerMap.get(operation.containerItemId) ?? {};
                if (!Object.prototype.hasOwnProperty.call(allowed, operation.itemId)) {
                    failures.push(
                        `${process.id} operation ${operation.operation} uses disallowed pair ` +
                            `${operation.containerItemId} -> ${operation.itemId}`
                    );
                }
            }
        }

        expect(failures).toEqual([]);
    });
});
