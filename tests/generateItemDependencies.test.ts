import { describe, it, expect } from 'vitest';
import items from '../frontend/src/pages/inventory/json/items';
import gen from '../scripts/generate-item-dependencies.js';

const { buildMap } = gen as {
  buildMap: () => Record<string, { requires: string[]; rewards: string[] }>;
};

const getId = (name: string) => items.find((i) => i.name === name)?.id;

describe('generate-item-dependencies buildMap', () => {
  it('includes quests that require items', () => {
    const map = buildMap();
    const pineBoard = getId('Pine board');
    expect(pineBoard).toBeDefined();
    expect(map[pineBoard!]).toBeDefined();
    expect(map[pineBoard!].requires).toContain('woodworking/workbench');
  });

  it('includes quests that reward items', () => {
    const map = buildMap();
    const dUsd = getId('dUSD');
    expect(dUsd).toBeDefined();
    expect(map[dUsd!]).toBeDefined();
    expect(map[dUsd!].rewards).toContain('ubi/basicincome');
  });
});
