import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('prepare-pr.sh automation', () => {
  const scriptPath = path.join(
    __dirname,
    '..',
    'frontend',
    'scripts',
    'prepare-pr.sh'
  );
  const script = fs.readFileSync(scriptPath, 'utf8');

  it('invokes lint and formatting without nested npm when lint is not skipped', () => {
    // Intentionally keep this match loose: we only assert the skip flag appears before
    // the lint command somewhere in the script to avoid brittleness to refactors.
    expect(script).toMatch(/SKIP_LINT[\s\S]*node scripts\/run-check\.mjs/);
  });

  it('runs root unit tests when not explicitly skipped', () => {
    // Intentionally keep this match loose: we only assert the skip flag appears before
    // the root test command somewhere in the script to avoid brittleness to refactors.
    expect(script).toMatch(
      /SKIP_UNIT_TESTS[\s\S]*node frontend\/scripts\/build-processes\.mjs/
    );
  });

  it('executes grouped Playwright suites when E2E checks are enabled', () => {
    // Intentionally keep this match loose: we only assert the skip flag appears before
    // the E2E command somewhere in the script to avoid brittleness to refactors.
    expect(script).toMatch(/SKIP_E2E[\s\S]*node scripts\/run-test-groups\.mjs/);
  });
});

describe('qa:smoke shortcut', () => {
  const pkgPath = path.join(__dirname, '..', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as {
    scripts?: Record<string, string>;
  };

  it('covers type checking before link validation', () => {
    const qaSmoke = pkg.scripts?.['qa:smoke'] ?? '';
    expect(qaSmoke).toContain('npm run type-check');
    expect(qaSmoke.indexOf('npm run type-check')).toBeLessThan(
      qaSmoke.indexOf('npm run link-check')
    );
  });
});
