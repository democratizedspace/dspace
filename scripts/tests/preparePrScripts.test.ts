import { readFileSync } from 'fs';
import { expect, test } from 'vitest';

test('prepare-pr scripts install Playwright browsers and run root tests', () => {
  const sh = readFileSync('frontend/scripts/prepare-pr.sh', 'utf8');
  const ps = readFileSync('frontend/scripts/prepare-pr.ps1', 'utf8');

  // Ensure both scripts use the shared Playwright bootstrap helper.
  expect(sh).toMatch(/node\s+scripts\/ensure-playwright-browsers\.mjs/);
  expect(ps).toMatch(/node\s+scripts\/ensure-playwright-browsers\.mjs/);

  // Do not include deprecated --with-deps flag
  expect(sh).not.toMatch(/--with-deps/);
  expect(ps).not.toMatch(/--with-deps/);

  // Root tests are run afterward
  expect(sh).toMatch(/npm run test:root/);
  expect(ps).toMatch(/npm run test:root/);
});
