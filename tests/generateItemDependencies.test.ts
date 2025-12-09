import { describe, it, expect } from 'vitest';
import items from '../frontend/src/pages/inventory/json/items';
import gen from '../scripts/generate-item-dependencies.js';

const { buildMap } = gen as {
  buildMap: () => Record<string, { requires: string[]; rewards: string[] }>;
};

const itemById = new Map(items.map((item) => [item.id, item]));

describe('generate-item-dependencies buildMap', () => {
  const questRequiresId = 'welcome/intro-inventory';
  const questRewardsId = 'welcome/howtodoquests';

  it('includes quests that require items', () => {
    const map = buildMap();
    const entry = Object.entries(map).find(([, value]) =>
      value.requires?.includes(questRequiresId)
    );

    expect(entry?.[0]).toBeDefined();

    const [itemId, value] = entry!;
    expect(itemById.has(itemId)).toBe(true);
    expect(value.requires).toContain(questRequiresId);
  });

  it('includes quests that reward items', () => {
    const map = buildMap();
    const entry = Object.entries(map).find(([, value]) =>
      value.rewards?.includes(questRewardsId)
    );

    expect(entry?.[0]).toBeDefined();

    const [itemId, value] = entry!;
    expect(itemById.has(itemId)).toBe(true);
    expect(value.rewards).toContain(questRewardsId);
  });
});
