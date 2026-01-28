import { describe, expect, it } from 'vitest';
import { evaluateTitles, TITLES } from '../frontend/src/utils/titles.js';
import items from '../frontend/src/pages/inventory/json/items/index.js';

const findItemId = (name: string) =>
  items.find((item) => item.name === name)?.id ?? '';

const dWattId = findItemId('dWatt');
const solarSetupId = findItemId('Solar setup (1 kWh)');
const guidedStackId = findItemId('guided flight stack');
const starTrailId = findItemId('stacked star trail photo');

describe('evaluateTitles', () => {
  it('keeps titles locked when the player is new', () => {
    const summaries = evaluateTitles({});
    expect(summaries).toHaveLength(TITLES.length);
    expect(summaries.every((summary) => summary.unlocked === false)).toBe(true);
  });

  it('unlocks prestige titles as milestones are met', () => {
    const quests = Object.fromEntries(
      Array.from({ length: 30 }, (_, index) => [
        `quest-${index + 1}`,
        { finished: true },
      ])
    );
    const inventory = {
      ...(dWattId ? { [dWattId]: 5000 } : {}),
      ...(solarSetupId ? { [solarSetupId]: 1 } : {}),
      ...(guidedStackId ? { [guidedStackId]: 1 } : {}),
      ...(starTrailId ? { [starTrailId]: 1 } : {}),
    };

    const summaries = evaluateTitles({ quests, inventory });

    const unlockedNames = summaries
      .filter((summary) => summary.unlocked)
      .map((summary) => summary.name);

    expect(unlockedNames).toContain('Quest Vanguard');
    expect(unlockedNames).toContain('Grid Magnate');
    expect(unlockedNames).toContain('Solar Architect');
    expect(unlockedNames).toContain('Guidance Officer');
    expect(unlockedNames).toContain('Stellar Cartographer');
  });
});
