import { readFileSync } from 'fs';
import { expect, test } from 'vitest';

test('prepare-pr scripts install Playwright browsers', () => {
  const sh = readFileSync('frontend/scripts/prepare-pr.sh', 'utf8');
  const ps = readFileSync('frontend/scripts/prepare-pr.ps1', 'utf8');
  expect(sh).toMatch(/playwright install --with-deps/);
  expect(ps).toMatch(/playwright install --with-deps/);
});
