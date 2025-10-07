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

  it('links to the shipped contributors guide instead of promising it later', () => {
    const content = readFileSync(changelogPath, 'utf8');
    expect(content).not.toMatch(/I'\ll be releasing a contributors guide soon\./i);
    expect(content).toMatch(/\[Contribute guide\]\(\/docs\/contribute\)/i);
  });
});
