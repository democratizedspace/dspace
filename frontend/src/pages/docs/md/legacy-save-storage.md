---
title: 'Legacy save storage (v1/v2/v3)'
slug: 'legacy-save-storage'
---

# Legacy save storage (v1/v2/v3)

This doc is the canonical reference for how DSPACE stores saves across v1, v2, and v3, plus how
migration detection works today.

## Release timeline context

- **V1 era**: The pre-v2 app relied on cookie-based inventory. The v2 release notes call out a
  reset for returning v1 players, which is the latest published anchor for the v1 era.
  See the v2 release notes dated **2023-06-30** for that handoff point.
- **V2 era**: The localStorage-based save format shipped in the v2 release (2023-06-30) and was
  expanded in v2.1 (2023-09-15). These are the latest published anchors for v2 before v3.

Reference changelog entries:

- `/docs/changelog/20230630` (v2 release)
- `/docs/changelog/20230915` (v2.1 release)

## V1 storage design (cookies)

**Where:** `document.cookie` on the game origin.

**Schema:** each item is stored as a cookie with the key pattern `item-<numericId>`.

**Examples (from the QA fixture):**

- `item-3=75`
- `item-10=2`
- `item-83=1`
- `item-21=20%2B` (URL-encoded `20+` still parses as `20`)

**Authoritative sources:**

- Cookie parsing + detection helper: `frontend/src/utils/legacySaveDetection.ts`
- QA fixture + seeding data: `frontend/src/utils/legacySaveFixtures/legacy_v1_cookie_save.json`
- QA cookie seeding behavior: `frontend/src/utils/legacySaveSeeding.ts`
- Astro cookie parsing helper (SSR paths): `frontend/src/utils/migrationCookies.js`

**Detection logic:**

- The v1 detector scans `document.cookie`, matches cookie names against `/^item-\d+$/`,
  URL-decodes values, and parses counts with `parseFloat`.
- Invalid values do **not** block detection; they are surfaced in the UI so QA can clear
  or reseed cookies.

## V2 storage design (localStorage)

**Where:** `localStorage` on the game origin.

**Schema:** JSON blobs stored under `gameState` and `gameStateBackup`.

**Example keys:**

- `localStorage['gameState']`
- `localStorage['gameStateBackup']`

**Authoritative sources:**

- Key names + v2 snapshot parsing: `frontend/src/utils/gameState/common.js`
- Legacy detection (v2 version markers): `frontend/src/utils/legacySaveDetection.ts`
- QA fixture + seeding data:
  `frontend/src/utils/legacySaveFixtures/legacy_v2_localstorage_save.json`
- QA localStorage seeding behavior: `frontend/src/utils/legacySaveSeeding.ts`

**Detection logic:**

- The detector reads `gameState`/`gameStateBackup`, parses JSON, and checks version markers that
  start with `1` or `2` to distinguish legacy data from v3.

## V3 storage design (IndexedDB)

**Where:** IndexedDB (primary) with localStorage fallback when IndexedDB is unavailable.

**Schema:**

- Database name: `dspaceGameState`
- Schema version: `1`
- Object stores: `state` and `backup`
- Root key: `root`

**Authoritative sources:**

- IndexedDB schema + key names: `frontend/src/utils/gameState/common.js`
- Migration/import helpers: `frontend/src/utils/gameState.js`

## Migration + upgrade behavior

**Shared detection**

- Both the global legacy banner and `/settings` use `detectLegacyArtifacts()` in
  `frontend/src/utils/legacySaveDetection.ts` to detect v1 cookies and v2 localStorage.

**Merge vs replace semantics**

- **V1 → V3 merge**: adds item counts to the current IndexedDB save, then grants the Early
  Adopter Token if any v1 items were imported.
- **V1 → V3 replace**: overwrites the current save with only the imported v1 inventory and the
  Early Adopter Token.
- **V2 → V3 merge**: merges inventory while keeping existing quests/processes, then grants the
  V2 Upgrade Trophy.
- **V2 → V3 replace**: replaces the current save with the v2 snapshot and grants the trophy.

Reference implementations:

- V1 + V2 import/merge helpers: `frontend/src/utils/gameState.js`
- Settings UI + cookie cleanup: `frontend/src/components/svelte/LegacySaveUpgrade.svelte`

**Cleanup behavior**

- V1 cookies are explicitly expired after import via the settings UI.
- V2 localStorage keys are removed when v3 saves are persisted (unless IndexedDB is unavailable).

## QA seeding + validation

**Seeding tools**

- QA buttons live in `frontend/src/components/svelte/QaCheatsToggle.svelte` and call
  `frontend/src/utils/legacySaveSeeding.ts` to write sample cookies/localStorage.

**Validation checklist**

1. Open DevTools → Application.
2. Inspect Cookies for keys like `item-3`, `item-21`.
3. Inspect Local Storage for `gameState` and `gameStateBackup` keys.
4. Inspect IndexedDB → `dspaceGameState` → `state` → `root` for the merged inventory.
5. Confirm the Early Adopter Token appears in the saved inventory after a v1 merge.
