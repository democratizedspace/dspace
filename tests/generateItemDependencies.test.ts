import { describe, it, expect } from 'vitest';
import items from '../frontend/src/pages/inventory/json/items';
import gen from '../scripts/generate-item-dependencies.js';

const { buildMap } = gen as {
  buildMap: () => Record<string, { requires: string[]; rewards: string[] }>;
};

const getId = (name: string) => items.find((i) => i.name === name)?.id;

function expectItemEntry(name: string, map: ReturnType<typeof buildMap>) {
  const id = getId(name);
  expect(id, `Expected an item id for ${name}`).toBeDefined();

  const entry = map[id!];
  expect(entry, `Expected a dependency map entry for ${name}`).toBeDefined();

  return entry!;
}

describe('generate-item-dependencies buildMap', () => {
  it('includes quests that require items', () => {
    const map = buildMap();
    const heater = expectItemEntry('aquarium heater (150 W)', map);

    expect(heater.requires.length).toBeGreaterThan(0);
    expect(heater.requires).toContain('aquaria/heater-install');
  });

  it('includes quests that reward items', () => {
    const map = buildMap();
    const fishFriend = expectItemEntry('Fish Friend Award', map);

    expect(fishFriend.rewards.length).toBeGreaterThan(0);
    expect(fishFriend.rewards).toContain('aquaria/goldfish');
  });

  it('captures items granted mid-quest', () => {
    const map = buildMap();
    const phStrip = expectItemEntry('pH strip', map);

    expect(phStrip.rewards.length).toBeGreaterThan(0);
    expect(phStrip.rewards).toContain('aquaria/ph-strip-test');
  });
});
