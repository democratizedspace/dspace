---
title: 'Legacy save storage (v1 → v3)'
slug: 'legacy-save-storage'
summary: 'Canonical reference for v1/v2/v3 storage and migration behavior.'
---

## Why this doc exists

DSPACE has shipped three storage generations. This guide is the canonical reference for how
v1 (cookies), v2 (localStorage), and v3 (IndexedDB) saves are structured, how detection and
migration work, and where the relevant code lives. It is intended for QA and developers who
need to confirm legacy upgrades or debug migrations.

Historical context is documented in the changelog entries that introduced each storage era:

- Cookies → localStorage intent (v1 → v2) in
  `frontend/src/pages/docs/md/changelog/20230101.md`.
- LocalStorage saves (v2) in `frontend/src/pages/docs/md/changelog/20230915.md`.
- IndexedDB migration (v3) in `frontend/src/pages/docs/md/changelog/20260201.md`.

## V1 storage (cookies)

**Storage location:** Browser cookies under the app domain (see
`frontend/src/utils/legacySaveSeeding.ts`).

**Schema:** Each inventory item is stored in its own cookie.

- **Key pattern:** `item-<id>` where `<id>` is the legacy item identifier.
- **Value:** Numeric item count, stored as a string. Values may be URL encoded or include
  “20+”-style artifacts; parsing is tolerant via `parseFloat`.
- **Examples:**
    - `item-3=75`
    - `item-10=2`
    - `item-21=20%2B` (parses as `20`)

**Canonical parsing:** `detectV1CookieItems` in `frontend/src/utils/legacySaveDetection.ts`.
It:

1. Splits `document.cookie` into key/value pairs.
2. Filters keys that match `/^item-\d+$/`.
3. Parses counts with `parseFloat`, ignoring non-positive or invalid values.
4. Reports invalid values so the UI can show a recovery message.

**Notes:** v1 cookies only encode inventory counts. Quest and process state did not exist in
cookies, so v1 upgrades only import items.

## V2 storage (localStorage)

**Storage location:** `localStorage` keys `gameState` and `gameStateBackup`. See the legacy
fixture at `frontend/src/utils/legacySaveFixtures/legacy_v2_localstorage_save.json`.

**Schema:** A JSON object with v2 `gameState` shape. Common fields:

- `versionNumberString`: typically `2.x`
- `inventory`: `{ [itemId: string]: number }`
- `quests`: `{ [questId: string]: { finished?: boolean; stepId?: string; ... } }`
- `processes`: `{ [processId: string]: { startedAt?: number; finished?: boolean; ... } }`
- `_meta`: `{ lastUpdated: number }`

**Detection:** `detectLegacyArtifacts` in `frontend/src/utils/legacySaveDetection.ts`.
It checks `localStorage` for `gameState` / `gameStateBackup`, then validates that the stored
object reports a `versionNumberString` or `versionNumber` starting with `1` or `2`.

## V3 storage (IndexedDB)

**Storage location:** IndexedDB database `dspaceGameState`
(`frontend/src/utils/gameState/common.js`).

- **Database name:** `dspaceGameState`
- **Schema version:** `DB_VERSION = 1`
- **Object stores:** `state` and `backup`
- **Key:** `root`

**Versioning strategy:** The IndexedDB version is currently `1`. Game-state schema versions
live inside the stored payload (e.g., `versionNumberString = '3'`). Upgrades write new state
snapshots and keep localStorage backups for resiliency (`gameState` / `gameStateBackup`).

## Detection + migration behavior

**Detection UI:**

- Global banner: `frontend/src/components/svelte/LegacyUpgradeBanner.svelte`
- Settings panel: `frontend/src/components/svelte/LegacySaveUpgrade.svelte`

Both call the shared detection helpers in `frontend/src/utils/legacySaveDetection.ts`.

**Merge vs replace:**

- **V1 → V3**: `importV1V3` (`frontend/src/utils/gameState.js`) merges item counts into the
  current save unless `replaceExisting` is true. When any items are imported, the
  **Early Adopter Token** trophy is granted. V1 cookies are not automatically removed; the
  Settings UI uses `expireLegacyCookies` to clear them.
- **V2 → V3 (merge)**: `mergeLegacyStateIntoCurrent` merges inventory counts and missing
  quest / process entries, keeping existing v3 progress.
- **V2 → V3 (replace)**: `importV2V3` overwrites the current save with the legacy state.
  Both merge/replace award the **V2 Upgrade Trophy**.

**Cleanup:** `persistMigratedState` clears `gameState` and `gameStateBackup` localStorage keys
when IndexedDB is available, so v2 legacy keys do not linger after import.

## QA seeding + validation

QA helpers live in `frontend/src/utils/legacySaveSeeding.ts` and the fixtures in
`frontend/src/utils/legacySaveFixtures/`:

- **Seed v1 cookies:** `seedSampleV1CookieSave()` writes `item-<id>` cookies.
- **Seed v2 localStorage:** `seedSampleV2LocalStorageSave()` writes a v2 `gameState` object.
- **Clear legacy saves:** `clearSeededLegacySaves()` removes both cookie and localStorage data.

Use `/settings` → **QA Cheats** → **Legacy save seeding** and follow the QA checklist in
`docs/qa/v3.md` §3.2.1 for manual verification.

## Inspecting data in browser DevTools

1. **V1 cookies:**
    - Open **Application** → **Cookies** → `staging.democratized.space` (or your domain).
    - Look for `item-<id>` keys and numeric values.
2. **V2 localStorage:**
    - Open **Application** → **Local Storage** → your domain.
    - Inspect `gameState` and `gameStateBackup` JSON payloads.
3. **V3 IndexedDB:**
    - Open **Application** → **IndexedDB** → `dspaceGameState`.
    - Inspect `state` and `backup` stores for the `root` key.

## Troubleshooting tips

- If the V1 card shows a parsing warning, clear cookies for `item-<id>` and re-seed using QA
  tools; malformed values are skipped for safety.
- If IndexedDB is blocked, DSPACE falls back to localStorage. Migration UI will warn when
  IndexedDB is unavailable and will avoid destructive actions.
