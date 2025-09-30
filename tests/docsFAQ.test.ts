import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('docs FAQ content', () => {
  const faqPath = join(
    process.cwd(),
    'frontend',
    'src',
    'pages',
    'docs',
    'md',
    'faq.md'
  );

  it('explains how to submit custom quests', () => {
    const content = readFileSync(faqPath, 'utf8');
    expect(content).toMatch(/## How do I submit custom quests\?/);
    expect(content).toMatch(/\[Quest Submission Guide\]\(\/docs\/quest-submission\)/);
  });
});
