import { readFileSync } from 'fs';
import { join } from 'path';

describe('npm test', () => {
  it('runs test:pr script', () => {
    const pkgPath = join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    expect(pkg.scripts.test).toBe('npm run test:pr');
  });
});
