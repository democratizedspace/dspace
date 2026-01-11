---
title: 'Legacy save storage & migrations'
slug: 'legacy-save-storage'
---

# Legacy save storage & migrations (v1, v2, v3)

This doc is the canonical reference for legacy save formats and the v1/v2/v3 migration
pathways used by the v3 UI.

## Release timeline

- **v2 (2023-06-30)** introduced the localStorage save format and reset quest progress while
  preserving inventory for returning v1 players. See the
  [June 30, 2023 changelog](/changelog#20230630) for details.
- **v2.1 (2023-09-15)** added more quests and kept the v2 localStorage format unchanged
  ([Sep 15, 2023 changelog](/changelog#20230915)).
- **v3 (2026-02-01)** moved persistence to IndexedDB and introduced automatic migration
  ([Feb 1, 2026 changelog](/changelog#20260201)).

## V1 storage (cookies)

**Shape**

- Cookie keys follow the pattern `item-<id>` (regex `^item-\d+$`).
- Values represent item counts as strings. Values may be URL-encoded, so parsing uses
  `decodeURIComponent` + `parseFloat`.
- Non-positive values are ignored.

**Example**

```
item-3=75
item-10=2
item-21=20%2B
item-83=1
```

The QA fixture in `frontend/src/utils/legacySaveFixtures/legacy_v1_cookie_save.json` shows
real samples. The QA seeding helper writes these cookies at `path=/` and adds the `Secure`
flag when running on HTTPS (`frontend/src/utils/legacySaveSeeding.ts`).

**Detection**

- The shared helper `detectV1CookieItems` in `frontend/src/utils/legacySaveDetection.ts`
  parses `document.cookie` for v1 keys and returns parsed items plus invalid cookie details.
- The global legacy banner and the Settings upgrade card both rely on this helper.

**DevTools**

Open **Application → Cookies** and filter by `item-` to view v1 entries.

## V2 storage (localStorage)

**Shape**

- Keys: `gameState` and `gameStateBackup`.
- Values: JSON-serialized objects containing quests, inventory, processes, and metadata.
- `versionNumberString` or `versionNumber` begins with `2` to mark legacy v2 data.

**Example**

```
localStorage.getItem('gameState') => {
  "versionNumberString": "2.1",
  "inventory": { "3": 120, "10": 2 },
  "quests": { "welcome/howtodoquests": { "finished": true } }
}
```

The QA fixture lives at `frontend/src/utils/legacySaveFixtures/legacy_v2_localstorage_save.json`,
and the seeding helper writes it into both keys (`frontend/src/utils/legacySaveSeeding.ts`).

**Detection**

The legacy detector checks for `gameState` or `gameStateBackup` and validates that the
embedded version string starts with `1` or `2`
(`frontend/src/utils/legacySaveDetection.ts`).

**DevTools**

Open **Application → Local Storage** and inspect the `gameState` / `gameStateBackup` keys.

## V3 storage (IndexedDB)

**Shape**

- Database name: `dspaceGameState`
- Schema version: `1`
- Object stores: `state`, `backup`
- Key: `root` in each store

The implementation lives in `frontend/src/utils/gameState/common.js`. The `state` store
contains the active save object, including `_meta.lastUpdated`. If IndexedDB is unavailable,
the system falls back to localStorage with a warning.

**DevTools**

Open **Application → IndexedDB → dspaceGameState → state → root**.

## Migration semantics

### V1 → V3

- **Merge** (`importV1V3`): adds cookie item counts into the current inventory and grants
  the **Early Adopter Token** trophy if any v1 items were imported.
- **Replace** (`importV1V3` with `replaceExisting`): wipes the current save and replaces it
  with v1 inventory data plus the trophy.

Legacy cookie cleanup happens in the Settings upgrade UI via the cookie expiry helper in
`frontend/src/components/svelte/LegacySaveUpgrade.svelte`.

### V2 → V3

- **Replace** (`importV2V3`): validates the v2 payload, stamps v3 version metadata, grants
  the **V2 Upgrade Trophy**, and writes the result to IndexedDB.
- **Merge** (`mergeLegacyStateIntoCurrent`): merges inventory counts, keeps existing quests
  and processes when conflicts exist, normalizes settings, and grants the trophy.

The migration helpers live in `frontend/src/utils/gameState.js`.

## QA seeding + validation

1. Enable **QA Cheats** in `/settings`.
2. Use **Seed sample v1 save (cookies)** or **Seed sample v2 save (localStorage)**.
3. Visit **Settings → Legacy save upgrades** to confirm detection and run merge/replace.
4. Verify the resulting IndexedDB entries in DevTools.

## Code references

- V1 cookie detection: `frontend/src/utils/legacySaveDetection.ts`
- V1 cookie fixtures: `frontend/src/utils/legacySaveFixtures/legacy_v1_cookie_save.json`
- V2 localStorage fixtures: `frontend/src/utils/legacySaveFixtures/legacy_v2_localstorage_save.json`
- QA seeding helpers: `frontend/src/utils/legacySaveSeeding.ts`
- IndexedDB storage engine: `frontend/src/utils/gameState/common.js`
- Migration helpers: `frontend/src/utils/gameState.js`
