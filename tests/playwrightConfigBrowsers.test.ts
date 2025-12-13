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
      /ensurePlaywrightBrowsers\(\{\s*cwd:\s*frontendDir\s*\}\);/
    );
  });
});
