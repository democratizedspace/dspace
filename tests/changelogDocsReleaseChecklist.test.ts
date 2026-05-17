import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('April 1, 2026 changelog release checklist', () => {
  const changelogPath = join(
    process.cwd(),
    'frontend',
    'src',
    'pages',
    'docs',
    'md',
    'changelog',
    '20260401.md'
  );

  it('drops the prerelease checklist language from the published notes', () => {
    const content = readFileSync(changelogPath, 'utf8');

    expect(content).not.toMatch(
      /This checklist will be removed before the final release/i
    );
    expect(content).not.toMatch(/\[x\]/i);
    expect(content).not.toMatch(/💯/);
  });

  it('publishes the v3.0.1 reader guide in the changelog body', () => {
    const content = readFileSync(changelogPath, 'utf8');

    expect(content).toContain(
      '## June 1, 2026 — DSPACE v3.0.1 (patch addendum)'
    );
    expect(content).toContain('### Reader guide and verification routes');
    expect(content).toContain('The player-visible route checks for v3.0.1');
  });
});
