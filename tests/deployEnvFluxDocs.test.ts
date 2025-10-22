import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('deploy env overlays documentation', () => {
  const docPath = join(process.cwd(), 'docs', 'config.md');

  it('documents environment overlays for Flux consumption', () => {
    const markdown = readFileSync(docPath, 'utf8');

    expect(markdown).toMatch(/##\s+Environment overlays/i);
    expect(markdown).toMatch(/\|\s*Environment\s*\|\s*Hostname\s*\|\s*Image strategy\s*\|\s*Metrics\s*\|\s*Feature flags\s*\|\s*Notes\s*\|/i);
    expect(markdown).toMatch(/\|\s*dev\s*\|\s*`?dev\.dspace\.example\.com`?\s*\|/);
    expect(markdown).toMatch(/\|\s*int\s*\|\s*`?int\.dspace\.example\.com`?\s*\|/);
    expect(markdown).toMatch(/\|\s*prod\s*\|\s*`?dspace\.example\.com`?\s*\|/);
    expect(markdown).toMatch(/dspace-dev-values/);
    expect(markdown).toMatch(/dspace-int-values/);
    expect(markdown).toMatch(/dspace-prod-values/);
  });
});
