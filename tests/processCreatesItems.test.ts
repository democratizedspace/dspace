import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

type ItemRef = {
  id: string;
  count: number;
};

type ProcessDefinition = {
  id: string;
  createItems?: ItemRef[];
};

type InventoryItem = {
  id: string;
  name: string;
};

const repoRoot = path.resolve(__dirname, '..');

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')) as T;
}

describe('process tangible outputs', () => {
  it('every process creates at least one tangible inventory item', () => {
    const processes = readJson<ProcessDefinition[]>('frontend/src/pages/processes/base.json');
    const inventoryItemFiles = fs
      .readdirSync(path.join(repoRoot, 'frontend/src/pages/inventory/json/items'))
      .filter((file) => file.endsWith('.json'));

    const inventoryItems = inventoryItemFiles.flatMap((file) =>
      readJson<InventoryItem[]>(`frontend/src/pages/inventory/json/items/${file}`)
    );
    const inventoryItemIds = new Set(inventoryItems.map((item) => item.id));

    const failing = processes
      .map((process) => {
        const outputs = process.createItems ?? [];
        const hasOutput = outputs.length > 0;
        const hasPositiveCounts = outputs.every((item) => item.count > 0);
        const mapsToInventoryItems = outputs.every((item) => inventoryItemIds.has(item.id));

        if (hasOutput && hasPositiveCounts && mapsToInventoryItems) {
          return null;
        }

        return {
          id: process.id,
          hasOutput,
          hasPositiveCounts,
          mapsToInventoryItems,
          missingItemIds: outputs.filter((item) => !inventoryItemIds.has(item.id)).map((item) => item.id),
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    expect(failing).toEqual([]);
  });
});
