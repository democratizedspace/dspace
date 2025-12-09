import { describe, it, expect } from 'vitest';
import items from '../frontend/src/pages/inventory/json/items';
import gen from '../scripts/generate-item-dependencies.js';

const { buildMap } = gen as {
  buildMap: () => Record<string, { requires: string[]; rewards: string[] }>;
};

const getId = (name: string) => items.find((i) => i.name === name)?.id;

function expectItemEntry(name: string, map: ReturnType<typeof buildMap>) {
  const id = getId(name);
  expect(id, `Expected to find item id for ${name}`).toBeDefined();
  expect(map[id!], `Expected dependency map entry for ${name}`).toBeDefined();
  return map[id!];
}

describe('generate-item-dependencies buildMap', () => {
  it('includes quests that require items', () => {
    const map = buildMap();
    const smartPlug = expectItemEntry('smart plug', map);

    expect(smartPlug.requires).toContain('welcome/intro-inventory');
    expect(smartPlug.requires.length).toBeGreaterThan(0);
  });

  it('includes quests that reward items', () => {
    const map = buildMap();
    const dChat = expectItemEntry('dChat', map);

    expect(dChat.rewards).toContain('welcome/howtodoquests');
    expect(dChat.rewards.length).toBeGreaterThan(0);
  });
});
