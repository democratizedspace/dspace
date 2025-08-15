import { readFileSync } from 'node:fs';

// Ensure repository license metadata has migrated to MIT

describe('license metadata', () => {
  test('package.json declares MIT license', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(pkg.license).toBe('MIT');
  });

  test('package-lock.json root package uses MIT license', () => {
    const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
    expect(lock.packages?.['']?.license).toBe('MIT');
  });
});
