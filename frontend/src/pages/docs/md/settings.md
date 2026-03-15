---
title: 'Settings'
slug: 'settings'
---

# Settings

`/settings` is the control center for account-adjacent state, migration helpers, and data safety
controls in v3.

## Key capabilities

- Cloud sync credential management
- Legacy save detection and migration actions (v1/v2 → v3)
- QA/testing toggles in supported environments
- Save reset/cleanup utilities

## Migration notes

v3 stores primary game state in IndexedDB. Legacy cookie/localStorage saves are treated as migration
sources, not active storage backends.

## Safe-change checklist

1. Export backup before running migration/replace actions.
2. Confirm expected counts in `/stats` after migration.
3. Verify quest and inventory continuity on `/quests` and `/inventory`.
4. If needed, restore from `/gamesaves` or cloud backup.

## Related docs

- [Legacy Save Storage](/docs/legacy-save-storage)
- [State Migration](/docs/state-migration)
- [Cloud Sync](/docs/cloud-sync)
- [Backups](/docs/backups)
