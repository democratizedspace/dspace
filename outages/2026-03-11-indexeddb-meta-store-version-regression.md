# IndexedDB fallback alert shown on every page load

## Summary

After PR #3933 deployed, players on browsers with an existing `dspaceGameState` IndexedDB
started seeing this alert on every page load:

> IndexedDB is unavailable; falling back to localStorage. Storage may be limited.

This was a false negative. IndexedDB support itself was healthy, but the app regressed into
localStorage fallback due to a schema versioning mismatch.

## Root cause

PR #3933 introduced a new IndexedDB object store (`meta`) used for lightweight checksum snapshots.
However, the database version in `frontend/src/utils/gameState/common.js` remained at `1`.

For existing players who already had a version-1 database (`state` + `backup` stores only), no
`onupgradeneeded` migration executed, so `meta` was never created. Subsequent reads/writes to
`meta` failed with `NotFoundError`, which was handled by setting `useLocalStorage = true` and
showing the fallback alert.

## Fix

- Bumped `dspaceGameState` DB version from `1` to `2` so existing v1 databases run an upgrade.
- Kept `onupgradeneeded` idempotent store creation logic so the `meta` store is created during
  migration without affecting existing data.

## Regression tests added

1. **Unit/integration (Vitest):** `frontend/tests/gameStateIndexedDbMigration.test.ts`
   - Seeds a legacy v1 IndexedDB database (`state`, `backup` only).
   - Imports game state persistence and awaits `ready`.
   - Asserts no fallback alert appears and IndexedDB remains active.
   - Verifies checksum metadata persists after a save.

2. **Browser E2E (Playwright, runs in CI):**
   `frontend/e2e/indexeddb-availability.spec.ts`
   - Visits `/` and captures any JavaScript dialogs.
   - Verifies IndexedDB is supported and `dspaceGameState` contains the `meta` object store.
   - Fails if the fallback alert message is shown.

## Prevention

Any future IndexedDB schema expansion must increment `DB_VERSION` in lockstep with object store
changes. The new unit + E2E coverage now catches both migration gaps and user-visible fallback
alerts before merge/deploy.
