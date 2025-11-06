import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('October 31, 2022 changelog', () => {
  it('preserves the original copy and adds a forward-looking note', () => {
    const changelogPath = join(
      process.cwd(),
      'frontend',
      'src',
      'pages',
      'docs',
      'md',
      'changelog',
      '20221031.md'
    );

    const content = readFileSync(changelogPath, 'utf8');

    expect(content).toMatch(/Next up: a big content update!/i);
    expect(content).toMatch(
      /notes:\s*\n\s*-\s+title:\s*['"]June 30, 2023 – Quest expansion follow-up['"]\s*\n\s+slug:\s*['"]20230630['"]/i
    );
  });
});
