import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

describe('package.json', () => {
  it('declares pnpm with a full semver version', () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
    expect(pkg.packageManager).toMatch(/^pnpm@\d+\.\d+\.\d+$/);
  });
});

describe('frontend/package.json', () => {
  it('has no duplicate devDependencies', () => {
    const pkgPath = join(__dirname, '..', 'frontend', 'package.json');
    const text = readFileSync(pkgPath, 'utf8');
    const match = text.match(/"devDependencies"\s*:\s*{([^}]*)}/s);
    expect(match).toBeTruthy();
    const block = match![1];
    const counts: Record<string, number> = {};
    const regex = /"([^"\n]+)":/g;
    let m;
    while ((m = regex.exec(block)) !== null) {
      const name = m[1];
      counts[name] = (counts[name] || 0) + 1;
    }
    const duplicates = Object.entries(counts)
      .filter(([, c]) => c > 1)
      .map(([name]) => name);
    expect(duplicates).toEqual([]);
  });
});
