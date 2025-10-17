import { readFileSync } from 'fs';
import { expect, test } from 'vitest';

test('prepare-pr scripts install Playwright browsers and run root tests', () => {
  const sh = readFileSync('frontend/scripts/prepare-pr.sh', 'utf8');
  const ps = readFileSync('frontend/scripts/prepare-pr.ps1', 'utf8');
  expect(sh).toMatch(/PLAYWRIGHT_CLI="node_modules\/@playwright\/test\/cli\.js"/);
  expect(sh).toMatch(/node "\$PLAYWRIGHT_CLI" install/);
  expect(ps).toMatch(/@playwright\\test\\cli\.js/);
  expect(ps).toMatch(/node \$playwrightCli install/);
  expect(sh).not.toMatch(/--with-deps/);
  expect(ps).not.toMatch(/--with-deps/);
  expect(sh).toMatch(/npm run test:root/);
  expect(ps).toMatch(/npm run test:root/);
});
