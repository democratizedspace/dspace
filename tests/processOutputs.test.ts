import { describe, expect, it } from 'vitest';
import path from 'path';
import { readdirSync, readFileSync } from 'fs';

import processes from '../frontend/src/pages/processes/base.json' assert { type: 'json' };

function loadItemIds(): Set<string> {
  const itemsDir = path.join(process.cwd(), 'frontend', 'src', 'pages', 'inventory', 'json', 'items');
  const itemFiles = readdirSync(itemsDir).filter(file => file.endsWith('.json'));
  const ids = new Set<string>();

  for (const file of itemFiles) {
    const fullPath = path.join(itemsDir, file);
    const records = JSON.parse(readFileSync(fullPath, 'utf8')) as Array<{ id: string }>;
    records.forEach(record => ids.add(record.id));
  }

  return ids;
}

describe('base processes create tangible outputs', () => {
  const allItemIds = loadItemIds();

  it('requires every process to create at least one item', () => {
    const missingOutputs = (processes as Array<any>)
      .filter(process => !Array.isArray(process.createItems) || process.createItems.length === 0)
      .map(process => process.id);

    expect(missingOutputs).toEqual([]);
  });

  it('requires created items to exist in the inventory catalog', () => {
    const unknownCreatedItems: string[] = [];

    (processes as Array<any>).forEach(process => {
      (process.createItems ?? []).forEach((item: { id: string; count: number }) => {
        if (!allItemIds.has(item.id)) {
          unknownCreatedItems.push(`${process.id}:${item.id}`);
        }
        expect(item.count).toBeGreaterThan(0);
      });
    });

    expect(unknownCreatedItems).toEqual([]);
  });
});
