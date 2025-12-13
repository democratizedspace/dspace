import { readFileSync } from 'fs';
import { expect, test } from 'vitest';

test('prepare-pr scripts install Playwright browsers and run root tests', () => {
  const sh = readFileSync('frontend/scripts/prepare-pr.sh', 'utf8');
  const ps = readFileSync('frontend/scripts/prepare-pr.ps1', 'utf8');

  // PLAYWRIGHT_CLI assignment allows optional quotes/spacing
  expect(sh).toMatch(/PLAYWRIGHT_CLI\s*=\s*"?node_modules\/@playwright\/test\/cli\.js"?/);

  // PowerShell path expectation
  expect(ps).toMatch(/@playwright\\test\\cli\.js/);

  // Ensure install is invoked via *local* CLI, tolerant to quotes and $ var syntax
  expect(sh).toMatch(/node\s+"?\$?PLAYWRIGHT_CLI"?\s+install/);
  expect(ps).toMatch(/node\s+\$playwrightCli\s+install/);

  // Do not include deprecated --with-deps flag
  expect(sh).not.toMatch(/--with-deps/);
  expect(ps).not.toMatch(/--with-deps/);

  // Root tests are run afterward
  expect(sh).toMatch(/npm run test:root/);
  expect(ps).toMatch(/npm run test:root/);
});
