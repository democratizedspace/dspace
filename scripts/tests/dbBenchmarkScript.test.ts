import { readFileSync } from 'fs';
import path from 'path';

test('package.json contains db:benchmark script', () => {
  const pkgPath = path.join(process.cwd(), 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  expect(pkg.scripts['db:benchmark']).toBeDefined();
});
