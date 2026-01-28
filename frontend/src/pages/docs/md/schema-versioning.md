---
title: 'Custom Content Schema Versioning'
slug: 'schema-versioning'
---

# Custom Content Schema Versioning

DSPACE tracks the structure of the custom content database with a numeric schema version. The
`schemaVersion` entry lives in the `meta` object store of the `CustomContent` IndexedDB database and
is compared to the current `CUSTOM_CONTENT_DB_VERSION` during database initialization. If the
stored version is older, migrations run automatically and the version is updated.

Use `getSchemaVersion` to inspect the current value:

```ts
import { getSchemaVersion } from '../utils/indexeddb.js';

const version = await getSchemaVersion();
console.log(`Custom content schema version: ${version}`);
```

The helper returns the latest schema version when IndexedDB is unavailable or the `schemaVersion`
entry is missing, keeping callers in sync with the application. After migrations run, DSPACE also
validates custom content records for data integrity.

## Migration History

- **v2** – adds a `createdAt` timestamp to items, processes and quests.
- **v3** – adds an `updatedAt` timestamp to all records.
