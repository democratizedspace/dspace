import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Quest copy regressions', () => {
  it('welcome/smart-plug-test avoids fixed dCarbon deduction phrasing', () => {
    const questPath = join(
      __dirname,
      '../frontend/src/pages/quests/json/welcome/smart-plug-test.json'
    );
    const quest = JSON.parse(readFileSync(questPath, 'utf8')) as {
      dialogue: Array<{ text?: string }>;
    };

    const combinedDialogue = quest.dialogue.map((node) => node.text ?? '').join(' ');

    expect(combinedDialogue).not.toMatch(/deducted from the sale value/i);
    expect(combinedDialogue).not.toMatch(/exact deduction/i);
    expect(combinedDialogue).toMatch(/current rate/i);
  });
});
