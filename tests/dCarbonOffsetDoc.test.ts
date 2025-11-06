import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('dCarbon offset documentation', () => {
  it('records the roadmap language alongside the follow-up note', () => {
    const changelogPath = join(
      process.cwd(),
      'frontend',
      'src',
      'pages',
      'docs',
      'md',
      'changelog',
      '20221210.md'
    );

    const raw = readFileSync(changelogPath, 'utf8');

    expect(raw).toMatch(/In a future update, you'll be able to burn dCarbon/i);
    expect(raw).toMatch(
      /notes:\s*\n\s*-\s+title:\s*['"]January 31, 2023 – Sustainable energy launch['"]\s*\n\s+slug:\s*['"]20230131['"]/i
    );
  });
});
