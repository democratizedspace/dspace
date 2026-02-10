import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Quest copy regressions', () => {
  it('welcome/smart-plug-test what-it-means uses variable-rate tax guidance copy', () => {
    const questPath = resolve(
      process.cwd(),
      'frontend/src/pages/quests/json/welcome/smart-plug-test.json'
    );
    const quest = JSON.parse(readFileSync(questPath, 'utf8')) as {
      dialogue?: Array<{ id?: string; text?: string }>;
    };

    const whatItMeansText =
      quest.dialogue?.find((node) => node.id === 'what-it-means')?.text ?? '';

    expect(whatItMeansText).not.toMatch(/deducted from the sale value/i);
    expect(whatItMeansText).not.toMatch(/exact deduction/i);

    expect(whatItMeansText).toMatch(/Sell button/i);
    expect(whatItMeansText).toMatch(/tax note/i);
    expect(whatItMeansText).toMatch(/dUSD/i);
    expect(whatItMeansText).toMatch(/dOffset|mint dOffset/i);
    expect(whatItMeansText).toMatch(/current rate/i);
  });
});
