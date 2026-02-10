import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Quest copy regressions', () => {
  it('welcome/smart-plug-test avoids fixed dCarbon deduction phrasing', () => {
    const questPath = resolve(
      process.cwd(),
      'frontend/src/pages/quests/json/welcome/smart-plug-test.json'
    );
    const questCopy = readFileSync(questPath, 'utf8');

    expect(questCopy).not.toMatch(/deducted from the sale value/i);
    expect(questCopy).not.toMatch(/exact deduction/i);
    expect(questCopy).toMatch(/current rate/i);
  });
});
