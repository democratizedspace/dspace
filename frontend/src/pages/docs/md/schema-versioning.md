---
title: 'Custom Content Schema Versioning'
slug: 'schema-versioning'
---

# Custom Content Schema Versioning

DSPACE tracks the structure of the custom content database with a numeric schema version stored in
the `meta` object store of the `CustomContent` IndexedDB database. When the app opens the database,
`runMigrations` updates older data and persists the latest version.

Use `getSchemaVersion` to inspect the current value:

```ts
import { getSchemaVersion } from '../utils/indexeddb.js';

const version = await getSchemaVersion();
console.log(`Custom content schema version: ${version}`);
```

If IndexedDB is unavailable (for example, during server-side rendering), the helper returns the
current application version so callers can still make decisions safely.

## Migration behavior

- Migrations run automatically in `openCustomContentDB`.
- After migrations, the database is validated for schema integrity.
- Validation failures surface as `DataIntegrityValidationError`, but the application continues to
  use the database so users can export or repair data.

## Migration history

- **v2** – adds a `createdAt` timestamp to items, processes, and quests.
- **v3** – adds an `updatedAt` timestamp to all records.
