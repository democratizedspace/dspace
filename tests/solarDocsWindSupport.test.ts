import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const solarDocPath = path.join(
  __dirname,
  '../frontend/src/pages/docs/md/solar.md'
);

describe('solar energy docs', () => {
  it('document current wind support instead of promising future coverage', () => {
    const content = fs.readFileSync(solarDocPath, 'utf8');

    expect(content).not.toMatch(/will also be added in the future/i);
    expect(content.toLowerCase()).toContain('wind');
    expect(content.toLowerCase()).toContain('turbine');
  });
});
