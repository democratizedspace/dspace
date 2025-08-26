import { readFileSync } from 'fs';
import { expect, test } from 'vitest';

test('prepare-pr scripts install Playwright browsers only when E2E tests run', () => {
  const sh = readFileSync('frontend/scripts/prepare-pr.sh', 'utf8');
  const ps = readFileSync('frontend/scripts/prepare-pr.ps1', 'utf8');
  expect(sh).toMatch(/if \[ -z "\$SKIP_E2E" \]; then\s+npx playwright install --with-deps/);
  expect(ps).toMatch(/if \(-not \$env:SKIP_E2E\)/);
  expect(ps).toMatch(/npx playwright install --with-deps/);
});
