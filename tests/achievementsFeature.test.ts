import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ACHIEVEMENTS, evaluateAchievements } from '../frontend/src/utils/achievements.js';

describe('achievements feature', () => {
  it('computes progress and unlocks based on game state', () => {
    const windTurbine = ACHIEVEMENTS.find((achievement) => achievement.id === 'equipment:wind-turbine');
    if (!windTurbine) {
      throw new Error('Expected equipment:wind-turbine achievement to be defined');
    }

    const sampleState = {
      quests: {
        'welcome/howtodoquests': { finished: true },
        'energy/solar': { finished: true }
      },
      inventory: {
        [windTurbine.requirement?.itemId ?? '']: 1,
        [windTurbine.requirement?.progressItemId ?? '']: 800
      },
      processes: {}
    } satisfies Parameters<typeof evaluateAchievements>[0];

    const results = evaluateAchievements(sampleState);

    const firstQuest = results.find((result) => result.id === 'quests:first');
    const questStreak = results.find((result) => result.id === 'quests:ten');
    const energyStored = results.find((result) => result.id === 'energy:stored');
    const ownsTurbine = results.find((result) => result.id === 'equipment:wind-turbine');

    expect(firstQuest?.unlocked).toBe(true);
    expect(firstQuest?.progress.current).toBe(2);
    expect(firstQuest?.progress.target).toBe(1);
    expect(firstQuest?.progress.percent).toBe(100);

    expect(questStreak?.unlocked).toBe(false);
    expect(questStreak?.progress.current).toBe(2);
    expect(questStreak?.progress.target).toBeGreaterThan(2);
    expect(questStreak?.progress.percent).toBeGreaterThan(0);

    expect(energyStored?.unlocked).toBe(true);
    expect(energyStored?.progress.current).toBeGreaterThanOrEqual(800);
    expect(energyStored?.progress.target).toBeLessThanOrEqual(800);
    expect(energyStored?.progress.percent).toBe(100);

    expect(ownsTurbine?.unlocked).toBe(true);
    expect(ownsTurbine?.progress.current).toBe(1);
    expect(ownsTurbine?.progress.target).toBe(1);
  });

  it('docs describe the shipped achievements system', () => {
    const docPath = join(
      process.cwd(),
      'frontend',
      'src',
      'pages',
      'docs',
      'md',
      'achievements.md'
    );

    const content = readFileSync(docPath, 'utf8');

    expect(content).not.toMatch(/not currently implemented/i);
    expect(content).toMatch(/track/i);
  });
});
