import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('playwright.config browser setup', () => {
  it('imports ensurePlaywrightBrowsers and wires it to the frontend directory', () => {
    const configPath = path.join(process.cwd(), 'frontend', 'playwright.config.ts');
    const contents = readFileSync(configPath, 'utf8');

    expect(contents).toMatch(
      /import\s+\{\s*ensurePlaywrightBrowsers\s*\}\s+from\s+'\.\/scripts\/utils\/ensure-playwright-browsers\.js';/
    );
    expect(contents).toMatch(
      /ensurePlaywrightBrowsers\(\{\s*cwd:\s*frontendDir,\s*env:\s*ensureEnv,\s*installArgs,\s*installSystemDeps:\s*!skipSystemDepsInstall,\s*\}\);/s
    );
    expect(contents).toMatch(/reuseExistingServer:\s*false/);
    expect(contents).toMatch(/4173 \+ \(process\.pid % 1000\)/);
  });
});
