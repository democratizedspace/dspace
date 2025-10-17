import { readFileSync } from 'fs';
import { describe, it, expect } from 'vitest';

const helpers = readFileSync('frontend/e2e/test-helpers.ts', 'utf8');

describe('Process form e2e helpers', () => {
  it('target the expanded ItemSelector buttons', () => {
    expect(helpers).toMatch(/\.items-list \.item-row/);
    expect(helpers).toMatch(/\.selector-expanded \.item-row/);
  });

  it('looks for accessible role based options', () => {
    expect(helpers).toMatch(/\.item-selector \[role="option"\]/);
  });
});
