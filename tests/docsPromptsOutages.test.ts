import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('docs/prompts/codex/prompts-outages.md', () => {
  const docPath = join(process.cwd(), 'docs', 'prompts', 'codex', 'prompts-outages.md');

  it('exists', () => {
    expect(existsSync(docPath)).toBe(true);
  });

  it('has the canonical heading', () => {
    const content = readFileSync(docPath, 'utf8');
    expect(content.startsWith('# Outage prompts for the DSPACE repo')).toBe(true);
  });
});
