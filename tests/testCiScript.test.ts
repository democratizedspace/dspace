import { readFileSync } from 'fs';
import { join } from 'path';

describe('test:ci script', () => {
  it('aliases to test:pr', () => {
    const pkgPath = join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    expect(pkg.scripts['test:ci']).toBe('npm run test:pr');
  });
});
