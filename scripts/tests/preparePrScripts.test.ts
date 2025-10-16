import { readFileSync } from 'fs';
import { expect, test } from 'vitest';

test('prepare-pr scripts respect skip flags and run core checks', () => {
  const sh = readFileSync('frontend/scripts/prepare-pr.sh', 'utf8');
  const ps = readFileSync('frontend/scripts/prepare-pr.ps1', 'utf8');
  expect(sh).not.toMatch(/playwright install --with-deps/);
  expect(ps).not.toMatch(/playwright install --with-deps/);
  expect(sh).toMatch(/SKIP_LINT/);
  expect(ps).toMatch(/SKIP_LINT/i);
  expect(sh).toMatch(/npm run test:root/);
  expect(ps).toMatch(/npm run test:root/);
  expect(sh).toMatch(/SKIP_E2E/);
  expect(ps).toMatch(/SKIP_E2E/i);
});
