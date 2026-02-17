import { describe, expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';

const itemsDir = path.join(__dirname, '../../frontend/src/pages/inventory/json/items');
const processFile = path.join(__dirname, '../../frontend/src/generated/processes.json');

const allItems = fs
    .readdirSync(itemsDir)
    .filter((file) => file.endsWith('.json'))
    .flatMap((file) => JSON.parse(fs.readFileSync(path.join(itemsDir, file), 'utf8')));

const itemIds = new Set(allItems.map((item) => item.id));
const itemById = new Map(allItems.map((item) => [item.id, item]));
const processes = JSON.parse(fs.readFileSync(processFile, 'utf8'));

describe('item container catalog and process validation', () => {
    test('itemCounts keys reference valid item ids and default values are exactly 0', () => {
        const issues: string[] = [];

        allItems.forEach((item) => {
            const itemCounts = item.itemCounts;
            if (!itemCounts || typeof itemCounts !== 'object') {
                return;
            }

            Object.entries(itemCounts).forEach(([storedItemId, defaultValue]) => {
                if (!itemIds.has(storedItemId)) {
                    issues.push(`${item.id} references unknown stored item id ${storedItemId}`);
                }

                if (defaultValue !== 0) {
                    issues.push(
                        `${item.id} has non-zero itemCounts default for ${storedItemId}: ${defaultValue}`
                    );
                }
            });
        });

        expect(issues).toEqual([]);
    });

    test('itemCountOperations only use allowed container/item pairs', () => {
        const issues: string[] = [];

        processes.forEach((process) => {
            (process.itemCountOperations || []).forEach((operation) => {
                const container = itemById.get(operation.containerItemId);
                const allowed = container?.itemCounts || {};
                if (!Object.prototype.hasOwnProperty.call(allowed, operation.itemId)) {
                    issues.push(
                        `${process.id} operation ${operation.operation} uses disallowed pair ` +
                            `${operation.containerItemId} -> ${operation.itemId}`
                    );
                }
            });
        });

        expect(issues).toEqual([]);
    });
});
