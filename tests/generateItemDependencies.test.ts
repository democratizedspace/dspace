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
    const smartPlug = getId('smart plug');
    expect(map[smartPlug!].requires).toContain('welcome/intro-inventory');
  });

  it('includes quests that reward items', () => {
    const map = buildMap();
    const dChat = getId('dChat');
    expect(map[dChat!].rewards).toContain('welcome/howtodoquests');
  });
});
