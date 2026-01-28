import { describe, expect, it } from 'vitest';
import { evaluateTitles, TITLES } from '../frontend/src/utils/titles.js';
import items from '../frontend/src/pages/inventory/json/items/index.js';

const findItemId = (name: string) =>
  items.find((item) => item.name === name)?.id ?? '';

const dWattId = findItemId('dWatt');
const dLaunchId = findItemId('dLaunch');
const windTurbineId = findItemId('500 W wind turbine');

describe('evaluateTitles', () => {
  it('keeps titles locked when the player is new', () => {
    const summaries = evaluateTitles({});
    expect(summaries).toHaveLength(TITLES.length);
    expect(summaries.every((summary) => summary.unlocked === false)).toBe(true);
  });

  it('unlocks quest, energy, and flight titles as milestones are met', () => {
    const quests = Object.fromEntries(
      Array.from({ length: 20 }, (_, index) => [
        `quest-${index + 1}`,
        { finished: true },
      ])
    );
    const inventory = {
      ...(dWattId ? { [dWattId]: 10000 } : {}),
      ...(dLaunchId ? { [dLaunchId]: 5 } : {}),
      ...(windTurbineId ? { [windTurbineId]: 1 } : {}),
    };

    const summaries = evaluateTitles({ quests, inventory });

    const unlockedNames = summaries
      .filter((summary) => summary.unlocked)
      .map((summary) => summary.name);

    expect(unlockedNames).toContain('Quest Commander');
    expect(unlockedNames).toContain('Power Mogul');
    expect(unlockedNames).toContain('Wind Architect');
    expect(unlockedNames).toContain('Launch Director');
  });
});
