import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

import { ITEM_SELECTOR_OPTION_LOCATORS } from '../frontend/e2e/utils/itemSelectors';

describe('Item selector locator coverage', () => {
  test('E2E helpers stay aligned with component markup', () => {
    const locatorBlob = ITEM_SELECTOR_OPTION_LOCATORS.join(' ');

    expect(locatorBlob).toMatch(/items-list/);
    expect(locatorBlob).toMatch(/item-row/);

    const componentPath = path.join(
      process.cwd(),
      'frontend',
      'src',
      'components',
      'svelte',
      'ItemSelector.svelte'
    );
    const componentSource = fs.readFileSync(componentPath, 'utf8');

    expect(componentSource).toContain('.items-list');
    expect(componentSource).toContain('class="item-row"');
  });
});
