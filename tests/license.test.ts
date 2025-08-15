import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('license compliance', () => {
  it('root package.json has MIT license', () => {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
    expect(pkg.license).toBe('MIT');
  });

  it('frontend package.json has MIT license', () => {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'frontend', 'package.json'), 'utf8'));
    expect(pkg.license).toBe('MIT');
  });

  it('LICENSE file contains MIT License header', () => {
    const license = readFileSync(join(process.cwd(), 'LICENSE'), 'utf8');
    expect(license).toContain('MIT License');
  });
});
