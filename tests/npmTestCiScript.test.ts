import { readFileSync } from 'fs';
import { join } from 'path';

describe('npm test:ci', () => {
  it('skips end-to-end tests', () => {
    const pkgPath = join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    expect(pkg.scripts['test:ci']).toBe('SKIP_E2E=1 npm run test:pr');
  });
});
