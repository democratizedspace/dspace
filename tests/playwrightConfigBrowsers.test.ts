import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('playwright.config browser setup', () => {
  it('imports ensurePlaywrightBrowsers and wires it to the frontend directory', () => {
    const configPath = path.join(
      process.cwd(),
      'frontend',
      'playwright.config.ts'
    );
    const contents = readFileSync(configPath, 'utf8');

    expect(contents).toMatch(
      /import\s+\{\s*ensurePlaywrightBrowsers\s*\}\s+from\s+'\.\/scripts\/utils\/ensure-playwright-browsers\.js';/
    );
    expect(contents).toMatch(
      /ensurePlaywrightBrowsers\(\{\s*cwd:\s*frontendDir,\s*env:\s*ensureEnv,\s*installArgs,\s*installSystemDeps:\s*!skipSystemDepsInstall,\s*\}\);/s
    );
  });
});

// Keep the preview launcher aligned with the installed Astro package, not its retired Astro 4 path.
describe('playwright.config Astro preview launcher', () => {
  it('uses the installed Astro CLI entrypoint', () => {
    const frontendDir = path.join(process.cwd(), 'frontend');
    const astroDir = path.join(frontendDir, 'node_modules', 'astro');
    const manifest = JSON.parse(
      readFileSync(path.join(astroDir, 'package.json'), 'utf8')
    );
    const bin = manifest.bin.astro.replace(/^\.\//, '');
    const contents = readFileSync(
      path.join(frontendDir, 'playwright.config.ts'),
      'utf8'
    );
    expect(existsSync(path.join(astroDir, bin))).toBe(true);
    expect(contents).toContain(
      `node ./node_modules/astro/${bin} preview --ignore-lock`
    );
    expect(contents).not.toContain('node ./node_modules/astro/astro.js');
  });
});
