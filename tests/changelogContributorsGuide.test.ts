import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('changelog 20230630 contributors guidance', () => {
  const changelogPath = join(
    process.cwd(),
    'frontend',
    'src',
    'pages',
    'docs',
    'md',
    'changelog',
    '20230630.md'
  );

  it('preserves the historical promise while pointing to the follow-up release', () => {
    const content = readFileSync(changelogPath, 'utf8');
    expect(content).toMatch(/I'll be releasing a contributors guide soon\./i);
    expect(content).toMatch(/notes:\s*-\s*title:\s*'September 15, 2023/i);
    expect(content).toMatch(/slug:\s*'20230915'/i);
  });
});
