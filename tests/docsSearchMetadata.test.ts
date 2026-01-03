import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  SEARCH_METADATA_PATH,
  collectDocsSearchMetadata,
} from '../scripts/docs-search-metadata.mjs';

describe('Docs search metadata', () => {
  it('stays in sync with docs markdown features', () => {
    const expectedMetadata = collectDocsSearchMetadata();
    const currentMetadata = JSON.parse(
      readFileSync(SEARCH_METADATA_PATH, 'utf8')
    );

    expect(currentMetadata).toEqual(expectedMetadata);
  });
});
