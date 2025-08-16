import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('docs/prompts-outages', () => {
  const docPath = join(process.cwd(), 'docs', 'prompts-outages.md');

  it('exists', () => {
    expect(existsSync(docPath)).toBe(true);
  });

  it('has the correct slug', () => {
    const content = readFileSync(docPath, 'utf8');
    expect(content).toMatch(/slug: 'prompts-outages'/);
  });
});
