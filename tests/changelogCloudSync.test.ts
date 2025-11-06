import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('September 15, 2023 changelog', () => {
  it('documents future cloud saves and references the release where it shipped', () => {
    const changelogPath = join(
      process.cwd(),
      'frontend',
      'src',
      'pages',
      'docs',
      'md',
      'changelog',
      '20230915.md'
    );

    const content = readFileSync(changelogPath, 'utf8');

    expect(content).toContain('DSPACE will eventually have cloud saves');
    expect(content).toMatch(/notes:\s*-\s*title:\s*'November 1, 2025/i);
    expect(content).toMatch(/slug:\s*'20251101'/i);
  });
});
