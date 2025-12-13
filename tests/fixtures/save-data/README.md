# Save Data Fixtures

These fixtures capture legacy custom-content saves so the IndexedDB migration
suite can replay real payloads. Add new files when schema changes land; name
files using the pattern `v<schema>-<slug>.json` and omit `createdAt`/`updatedAt`
fields so migrations must backfill them.
