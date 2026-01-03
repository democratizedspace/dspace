import { writeFileSync } from 'node:fs';
import {
  collectDocsSearchMetadata,
  SEARCH_METADATA_PATH,
} from './docs-search-metadata.mjs';

const metadata = collectDocsSearchMetadata();

writeFileSync(SEARCH_METADATA_PATH, `${JSON.stringify(metadata, null, 4)}\n`);
console.log(
  `Docs search metadata written to ${SEARCH_METADATA_PATH} for ${Object.keys(metadata).length} docs`
);
