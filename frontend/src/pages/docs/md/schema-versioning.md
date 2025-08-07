---
title: 'Custom Content Schema Versioning'
slug: 'schema-versioning'
---

# Custom Content Schema Versioning

DSPACE tracks the structure of the custom content database with a numeric schema version. The
`schemaVersion` entry lives in the `meta` object store of the `CustomContent` IndexedDB database and
is compared to the current `CUSTOM_CONTENT_DB_VERSION` on startup. If the stored version is older,
migrations run automatically and the version is updated.

Use `getSchemaVersion` to inspect the current value:

```ts
import { getSchemaVersion } from '../utils/indexeddb.js';

const version = await getSchemaVersion();
console.log(`Custom content schema version: ${version}`);
```

The helper ensures that a missing or outdated entry defaults to the latest schema version so the
database stays in sync with the application.
