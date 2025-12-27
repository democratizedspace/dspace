import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('quests-polish prompt documentation', () => {
  const docPath = join(process.cwd(), 'docs', 'prompts', 'codex', 'quests-polish.md');
  const doc = readFileSync(docPath, 'utf8');

  it('includes headings for all three prompts in order', () => {
    const headings = ['## Quest polish prompt', '## Merge compatibility prompt', '## Upgrade prompt'];
    let cursor = -1;

    for (const heading of headings) {
      const index = doc.indexOf(heading);
      expect(index).toBeGreaterThan(cursor);
      cursor = index;
    }
  });

  it('explains when to use each prompt before the code fences', () => {
    const fences = [...doc.matchAll(/```markdown/g)].map((match) => match.index ?? -1);
    const headings = [
      doc.indexOf('## Quest polish prompt'),
      doc.indexOf('## Merge compatibility prompt'),
      doc.indexOf('## Upgrade prompt'),
    ];

    headings.forEach((headingIndex, idx) => {
      const section = doc.slice(headingIndex, fences[idx]);
      expect(section).toMatch(/Use this/i);
    });
  });

  it('keeps copy-ready markdown fences for all prompts', () => {
    const fences = [...doc.matchAll(/```markdown/g)];
    expect(fences.length).toBe(3);
  });
});
