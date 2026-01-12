---
title: 'Legacy saves & storage migrations'
slug: 'legacy-save-storage'
---

# Legacy saves & storage migrations

This doc explains how DSPACE stores game state across v1 (cookies), v2 (localStorage), and v3
(IndexedDB), plus how the legacy upgrade flow detects and migrates older data.

## Release timeline context

- **V1 → V2 transition (June 30, 2023):** The v2 release notes call out returning v1 players and
  the quest reset, which anchors the cutoff between cookie-era saves and the v2 localStorage
  format. See [`/docs/changelog/20230630`][changelog-20230630].
- **V2.1 localStorage format (September 15, 2023):** v2.1 explicitly documents that game state is
  stored in localStorage. See [`/docs/changelog/20230915`][changelog-20230915].
- **V3 IndexedDB migration (February 1, 2026):** v3 ships the IndexedDB storage system and a
  migration path from localStorage. See [`/docs/changelog/20260201`][changelog-20260201].

## V1 storage (cookies)

**Schema:** Each item is stored as its own cookie.

- **Key pattern:** `item-<id>` (regex `/^item-\d+$/`).
- **Value:** numeric count as a string. Values may be URL-encoded (ex: `20%2B` → `20+`). Parsing is
  tolerant: the migration helper uses `parseFloat` on the decoded value and ignores non-positive
  counts instead of failing the whole detection.
- **Examples:**
    - `item-3=75`
    - `item-10=2`
    - `item-21=20%2B`

**Code references:**

- Cookie parsing + detection: [`frontend/src/utils/legacySaveDetection.ts`][legacy-save-detection]
  (`detectV1CookieItems`).
- QA fixtures used for seeding:
  [`frontend/src/utils/legacySaveFixtures/legacy_v1_cookie_save.json`][legacy-v1-fixture].
- Seeding helper: [`frontend/src/utils/legacySaveSeeding.ts`][legacy-save-seeding]
  (`seedSampleV1CookieSave`).

**DevTools inspection:**

- Chrome/Firefox Application tab → Cookies → `staging.democratized.space` (or your local host).
- Filter for keys starting with `item-` to view v1 item counts.

## V2 storage (localStorage)

**Schema:** A JSON object stored under two keys.

- **Keys:** `gameState` and `gameStateBackup`.
- **Payload:** JSON with `versionNumberString` beginning with `2`, plus `inventory`, `quests`,
  `processes`, `settings`, and `_meta`.
- **Example payload:**
    ```json
    {
        "versionNumberString": "2.1",
        "inventory": { "3": 120, "10": 2 },
        "quests": { "welcome/howtodoquests": { "finished": true } },
        "processes": { "processes/benchy": { "finished": true } },
        "_meta": { "lastUpdated": 1672534800000 }
    }
    ```

**Code references:**

- Detection + legacy parsing: [`frontend/src/utils/legacySaveDetection.ts`][legacy-save-detection]
  (`hasLegacyLocalStorage`).
- Fixture seed data:
  [`frontend/src/utils/legacySaveFixtures/legacy_v2_localstorage_save.json`][legacy-v2-fixture].
- Merge/replace logic: [`frontend/src/utils/gameState.js`][game-state-js] (`importV2V3`,
  `mergeLegacyStateIntoCurrent`).

**DevTools inspection:**

- Application tab → Local Storage → `https://<host>`.
- Inspect `gameState` and `gameStateBackup` values (JSON).

## V3 storage (IndexedDB)

**Schema:** The canonical v3 save lives in IndexedDB, with localStorage used as a lightweight backup
and fallback for unsupported environments.

- **Database:** `dspaceGameState` (version `1`).
- **Object stores:** `state`, `backup`.
- **Key:** `root` (the game state blob is stored under a fixed key).
- **LocalStorage mirrors:** `gameState` and `gameStateBackup` are still written after every save to
  provide a recovery path when IndexedDB is unavailable.

**Code references:**

- IndexedDB constants and store layout: [`frontend/src/utils/gameState/common.js`][game-state-common]
  (`DB_NAME`, `DB_VERSION`, `STATE_STORE`, `BACKUP_STORE`, `ROOT_KEY`).
- Persistence + fallback behavior: [`frontend/src/utils/gameState/common.js`][game-state-common]
  (`read`, `write`, `warnFallback`).

**DevTools inspection:**

- Application tab → IndexedDB → `dspaceGameState` → `state` / `backup` → key `root`.
- Compare with localStorage fallback keys if IndexedDB is blocked (Safari private mode, etc.).

## Detection & upgrade flow

**Detection logic:**

- V1 cookies are detected on the client with `detectV1CookieItems(document.cookie)`.
- V2 localStorage detection reads `gameState` / `gameStateBackup` and checks that
  `versionNumberString` (or `versionNumber`) starts with `1` or `2`.
- Shared detection entry point: [`frontend/src/utils/legacySaveDetection.ts`][legacy-save-detection]
  (`detectLegacyArtifacts`).

**Merge vs. replace semantics:**

- **V1 → V3:** `importV1V3` adds counts to the current inventory (merge) or rebuilds from scratch
  (replace) and grants the **Early Adopter Token** trophy if any v1 items were imported.
- **V2 → V3:** `importV2V3` replaces the current save with the legacy state, and
  `mergeLegacyStateIntoCurrent` combines inventory while preserving existing quests/processes.
- Both flows update `versionNumberString` to `3` and persist to IndexedDB.

**Cleanup behavior:**

- V1 cleanup expires each `item-<id>` cookie (see
  [`frontend/src/components/svelte/LegacySaveUpgrade.svelte`][legacy-save-upgrade]).
- V2 cleanup deletes `gameState` / `gameStateBackup` (also in the Legacy Save Upgrade UI).

## QA seeding

QA seeding writes known-good fixtures that match the above schemas.

- **V1 seed:** [`frontend/src/utils/legacySaveSeeding.ts`][legacy-save-seeding] reads
  [`frontend/src/utils/legacySaveFixtures/legacy_v1_cookie_save.json`][legacy-v1-fixture].
- **V2 seed:** [`frontend/src/utils/legacySaveSeeding.ts`][legacy-save-seeding] reads
  [`frontend/src/utils/legacySaveFixtures/legacy_v2_localstorage_save.json`][legacy-v2-fixture].

After seeding, use [`/settings`][settings] → **Legacy save upgrades** to merge or replace, and
verify detection with the global legacy banner (shared detection logic).

[changelog-20230630]: /docs/changelog/20230630
[changelog-20230915]: /docs/changelog/20230915
[changelog-20260201]: /docs/changelog/20260201
[legacy-save-detection]: https://github.com/democratizedspace/dspace/blob/main/frontend/src/utils/legacySaveDetection.ts
[legacy-save-seeding]: https://github.com/democratizedspace/dspace/blob/main/frontend/src/utils/legacySaveSeeding.ts
[legacy-v1-fixture]: https://github.com/democratizedspace/dspace/blob/main/frontend/src/utils/legacySaveFixtures/legacy_v1_cookie_save.json
[legacy-v2-fixture]: https://github.com/democratizedspace/dspace/blob/main/frontend/src/utils/legacySaveFixtures/legacy_v2_localstorage_save.json
[game-state-js]: https://github.com/democratizedspace/dspace/blob/main/frontend/src/utils/gameState.js
[game-state-common]: https://github.com/democratizedspace/dspace/blob/main/frontend/src/utils/gameState/common.js
[legacy-save-upgrade]: https://github.com/democratizedspace/dspace/blob/main/frontend/src/components/svelte/LegacySaveUpgrade.svelte
[settings]: /settings
