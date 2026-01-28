import { describe, expect, it } from 'vitest';
import { evaluateTitles, TITLES } from '../frontend/src/utils/titles.js';
import items from '../frontend/src/pages/inventory/json/items/index.js';

const findItemId = (name: string) =>
  items.find((item) => item.name === name)?.id ?? '';

const dWattId = findItemId('dWatt');
const testedInverterId = findItemId('load-tested inverter');
const launchpadId = findItemId('Model rocket launchpad');
const completionistAwardId = findItemId('Completionist Award');

describe('evaluateTitles', () => {
  it('keeps titles locked when the player is new', () => {
    const summaries = evaluateTitles({});
    expect(summaries).toHaveLength(TITLES.length);
    expect(summaries.every((summary) => summary.unlocked === false)).toBe(true);
  });

  it('unlocks prestige titles as milestones are met', () => {
    const quests = Object.fromEntries(
      Array.from({ length: 20 }, (_, index) => [
        `quest-${index + 1}`,
        { finished: true },
      ])
    );
    const inventory = {
      ...(dWattId ? { [dWattId]: 2200 } : {}),
      ...(testedInverterId ? { [testedInverterId]: 1 } : {}),
      ...(launchpadId ? { [launchpadId]: 1 } : {}),
      ...(completionistAwardId ? { [completionistAwardId]: 1 } : {}),
    };

    const summaries = evaluateTitles({ quests, inventory });

    const unlockedNames = summaries
      .filter((summary) => summary.unlocked)
      .map((summary) => summary.name);

    expect(unlockedNames).toContain('Mission Commander');
    expect(unlockedNames).toContain('Power Reserve');
    expect(unlockedNames).toContain('Grid Stabilizer');
    expect(unlockedNames).toContain('Launch Director');
    expect(unlockedNames).toContain('Completionist Laureate');
  });
});
