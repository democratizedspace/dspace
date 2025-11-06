import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const changelogPath = join(
  process.cwd(),
  'frontend',
  'src',
  'pages',
  'docs',
  'md',
  'changelog',
  '20230101.md'
);

describe('January 1, 2023 changelog', () => {
  it('documents the known issue and links to the follow-up release', () => {
    const doc = readFileSync(changelogPath, 'utf8');
    expect(doc).toMatch(/Currently, when you start a \[process]/i);
    expect(doc).toMatch(
      /notes:\s*\n\s*-\s+title:\s*['"]January 31, 2023 – Process reservation fix['"]\s*\n\s+slug:\s*['"]20230131['"]/i
    );
  });
});
