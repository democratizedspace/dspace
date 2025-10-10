import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const docPath = path.resolve(
  __dirname,
  '../frontend/src/pages/docs/md/titles.md'
);

describe('Titles documentation', () => {
  it('lists available titles with names and descriptions', () => {
    const content = readFileSync(docPath, 'utf8');
    expect(content).toMatch(/## Available titles/);
    expect(content).toMatch(/\*\*.+?\*\* \u2013/);
  });
});
