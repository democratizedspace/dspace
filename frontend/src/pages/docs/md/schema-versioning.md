---
title: 'Custom Content Schema Versioning'
slug: 'schema-versioning'
---

# Custom Content Schema Versioning

DSPACE tracks the structure of the custom content database with a numeric schema version stored in
the `meta` object store of the `CustomContent` IndexedDB database. When the app opens the database
via `openCustomContentDB` (`frontend/src/utils/indexeddb.js`), it calls `runMigrations`
(`frontend/src/utils/migrations.js`) to update older data and persist each schema step in `meta`.

Use `getSchemaVersion` to inspect the current value:

```ts
import { getSchemaVersion } from '../utils/indexeddb.js';

const version = await getSchemaVersion();
console.log(`Custom content schema version: ${version}`);
```

If IndexedDB is unavailable (for example, during server-side rendering or when no polyfill is
present), the helper returns the current application version (`CUSTOM_CONTENT_DB_VERSION`) so
callers can still make decisions safely.

## Migration behavior

- Migrations run automatically in `openCustomContentDB` (`frontend/src/utils/indexeddb.js`), which
  invokes `runMigrations` after a successful open.
- After migrations, `runMigrations` calls `validateDataIntegrity` and throws
  `DataIntegrityValidationError` (defined in `frontend/src/utils/migrations.js`) if it finds
  invalid records.
- `openCustomContentDB` catches `DataIntegrityValidationError` (or matching error codes/names),
  logs a warning, and continues to use the database; other errors still reject the open.

## Migration history

- **v2** – adds a `createdAt` timestamp to items, processes, and quests.
- **v3** – adds an `updatedAt` timestamp to all records.
