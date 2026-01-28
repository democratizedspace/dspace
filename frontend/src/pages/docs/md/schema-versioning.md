---
title: 'Custom Content Schema Versioning'
slug: 'schema-versioning'
---

# Custom Content Schema Versioning

DSPACE tracks the structure of the custom content database with a numeric schema version. The
`schemaVersion` entry lives in the `meta` object store of the `CustomContent` IndexedDB database and
is compared to the current `CUSTOM_CONTENT_DB_VERSION` when opening the database. If the stored
version is older, migrations run in order and the version is updated after each migration. The
migration pipeline also validates custom content data integrity before the database is considered
ready.

Use `getSchemaVersion` to inspect the current value:

```ts
import { getSchemaVersion } from '../utils/indexeddb.js';

const version = await getSchemaVersion();
console.log(`Custom content schema version: ${version}`);
```

The helper falls back to the latest schema version when IndexedDB is unavailable or when the
`schemaVersion` key is missing, so the application can continue to operate safely.

## Migration History

- **v2** – adds a `createdAt` timestamp to items, processes, and quests.
- **v3** – adds an `updatedAt` timestamp to all records (defaulting to `createdAt` when missing).
