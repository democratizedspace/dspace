import { readFileSync } from 'fs';
import { expect, test } from 'vitest';

test('prepare-pr scripts run root tests and support skipping lint', () => {
  const sh = readFileSync('frontend/scripts/prepare-pr.sh', 'utf8');
  const ps = readFileSync('frontend/scripts/prepare-pr.ps1', 'utf8');
  expect(sh).not.toMatch(/playwright install --with-deps/);
  expect(ps).not.toMatch(/playwright install --with-deps/);
  expect(sh).toMatch(/npm run test:root/);
  expect(ps).toMatch(/npm run test:root/);
  expect(sh).toMatch(/SKIP_LINT/);
  expect(ps).toMatch(/SKIP_LINT/);
});
