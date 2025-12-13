import { describe, expect, it } from 'vitest';
import { evaluateTitles, TITLES } from '../frontend/src/utils/titles.js';
import items from '../frontend/src/pages/inventory/json/items/index.js';

const findItemId = (name: string) =>
  items.find((item) => item.name === name)?.id ?? '';

const dWattId = findItemId('dWatt');
const windTurbineId = findItemId('500 W wind turbine');

describe('evaluateTitles', () => {
  it('keeps titles locked when the player is new', () => {
    const summaries = evaluateTitles({});
    expect(summaries).toHaveLength(TITLES.length);
    expect(summaries.every((summary) => summary.unlocked === false)).toBe(true);
  });

  it('unlocks quest and energy titles as milestones are met', () => {
    const quests = Object.fromEntries(
      Array.from({ length: 10 }, (_, index) => [
        `quest-${index + 1}`,
        { finished: true },
      ])
    );
    const inventory = {
      ...(dWattId ? { [dWattId]: 600 } : {}),
      ...(windTurbineId ? { [windTurbineId]: 1 } : {}),
    };

    const summaries = evaluateTitles({ quests, inventory });

    const unlockedNames = summaries
      .filter((summary) => summary.unlocked)
      .map((summary) => summary.name);

    expect(unlockedNames).toContain('Rookie Explorer');
    expect(unlockedNames).toContain('Mission Specialist');
    expect(unlockedNames).toContain('Grid Investor');
    expect(unlockedNames).toContain('Wind Pioneer');
  });
});
