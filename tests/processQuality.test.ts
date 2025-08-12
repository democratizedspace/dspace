import { describe, it, expect } from 'vitest';
import processes from '../frontend/src/generated/processes.json';
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
    const required = [
      'id',
      'title',
      'requireItems',
      'consumeItems',
      'createItems',
      'duration',
    ];
    for (const proc of processes as Array<any>) {
      for (const field of required) {
        expect(proc[field]).not.toBeUndefined();
      }
    }
  });
});
