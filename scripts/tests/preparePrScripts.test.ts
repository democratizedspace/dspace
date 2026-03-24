import { readFileSync } from 'fs';
import { expect, test } from 'vitest';

test('prepare-pr scripts call Playwright bootstrap helper and run root tests', () => {
  const sh = readFileSync('frontend/scripts/prepare-pr.sh', 'utf8');
  const ps = readFileSync('frontend/scripts/prepare-pr.ps1', 'utf8');

  // Shell helper assignment allows optional quotes/spacing
  expect(sh).toMatch(/PLAYWRIGHT_BOOTSTRAP\s*=\s*"?scripts\/utils\/ensure-playwright-browsers\.js"?/);

  // PowerShell helper path expectation
  expect(ps).toMatch(/ensure-playwright-browsers\.js/);

  // Ensure bootstrap helper is invoked via node, tolerant to quotes and $ var syntax
  expect(sh).toMatch(/node\s+"?\$?PLAYWRIGHT_BOOTSTRAP"?/);
  expect(ps).toMatch(/node\s+\$playwrightBootstrap/);

  // Do not include deprecated direct CLI install paths/flags
  expect(sh).not.toMatch(/@playwright\/test\/cli\.js/);
  expect(ps).not.toMatch(/@playwright\\test\\cli\.js/);
  expect(sh).not.toMatch(/--with-deps/);
  expect(ps).not.toMatch(/--with-deps/);

  // Root tests are run afterward
  expect(sh).toMatch(/npm run test:root/);
  expect(ps).toMatch(/npm run test:root/);
});
