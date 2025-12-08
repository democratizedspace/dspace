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
    const dWatt = getId('dWatt');

    expect(dWatt).toBeDefined();
    expect(map[dWatt!]).toBeDefined();
    expect(map[dWatt!].requires).toContain('energy/hand-crank-generator');
  });

  it('includes quests that reward items', () => {
    const map = buildMap();
    const smartPlug = getId('smart power strip');

    expect(smartPlug).toBeDefined();
    expect(map[smartPlug!]).toBeDefined();
    expect(map[smartPlug!].rewards).toContain('welcome/smart-plug-test');
  });
});
