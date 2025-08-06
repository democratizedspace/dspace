import { readFileSync } from 'fs';
import { describe, it, expect } from 'vitest';

describe('Astro Vite log level', () => {
  it('silences non-critical build messages', () => {
    const content = readFileSync('frontend/astro.config.mjs', 'utf8');
    expect(content).toContain("logLevel: 'error'");
  });
});
