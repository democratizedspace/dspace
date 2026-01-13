---
title: 'Legacy saves & storage migrations'
slug: 'legacy-save-storage'
---

# Legacy saves & storage migrations

This doc explains how DSPACE stores game state across v1 (cookies + localStorage), v2
(localStorage), and v3 (IndexedDB), plus how the legacy upgrade flow detects and migrates older
formats.

## Release timeline context

- **V1 → V2 transition (June 30, 2023):** The v2 release notes call out returning v1 players and
  the quest reset, which anchors the cutoff between cookie-era saves and the v2 localStorage
  format. See [`/changelog#20230630`](/changelog#20230630).
- **V2.1 localStorage format (September 15, 2023):** v2.1 explicitly documents that game state is
  stored in localStorage. See [`/changelog#20230915`](/changelog#20230915).
- **V3 IndexedDB migration (February 1, 2026):** v3 ships the IndexedDB storage system and a
  migration path from localStorage. See [`/changelog#20260201`](/changelog#20260201).

## DSPACE v1 save format (commit `fc840def24c5140411d2892f468960acb8250681`)

**High-level summary**

- **Storage split:** v1 writes inventory + quest progress into cookies and uses localStorage for
  process timers and machine locks.
- **v3 detection:** v3 checks cookies/localStorage for legacy artifacts; the intended migration
  scope for v1 is **items + currency balances**, but current detection only parses `item-<id>`
  cookies (see the v1 seed notes below).
- **Why skip quests/process timers:** v1 quest IDs are numeric (`0`, `1`, `2`), while v2/v3 use slug
  routes (ex: `/quests/3dprinter/start`). Process timers also depend on v1 process IDs/machine IDs
  that do not map 1:1. Treat quest/progress/process timers as **out-of-scope** for the default v1
  migration, even if the cookies exist.

**Primary v1 source files (commit `fc840def`):**

- Cookie acceptance + redirect UX:
  [`frontend/src/pages/accepted_cookies.astro`](https://github.com/democratizedspace/dspace/blob/fc840def24c5140411d2892f468960acb8250681/frontend/src/pages/accepted_cookies.astro)
- Cookie helpers + wallet balance functions:
  [`frontend/src/utils.js`](https://github.com/democratizedspace/dspace/blob/fc840def24c5140411d2892f468960acb8250681/frontend/src/utils.js)
- Inventory cookie reads/writes:
  [`frontend/src/pages/inventory/utils.js`](https://github.com/democratizedspace/dspace/blob/fc840def24c5140411d2892f468960acb8250681/frontend/src/pages/inventory/utils.js)
- Quest finish + checkpoint cookies:
  [`frontend/src/pages/quests/finish/`](https://github.com/democratizedspace/dspace/tree/fc840def24c5140411d2892f468960acb8250681/frontend/src/pages/quests/finish)
  (contains `[questId].astro`),
  [`frontend/src/pages/quests/play/`](https://github.com/democratizedspace/dspace/tree/fc840def24c5140411d2892f468960acb8250681/frontend/src/pages/quests/play)
  (contains `[questId]/[stepId].astro`)
- Process timers + machine locks:
  [`frontend/src/pages/processes/process.svelte`](https://github.com/democratizedspace/dspace/blob/fc840def24c5140411d2892f468960acb8250681/frontend/src/pages/processes/process.svelte)
- Process cooldown cookies:
  [`frontend/src/pages/processes/utils.js`](https://github.com/democratizedspace/dspace/blob/fc840def24c5140411d2892f468960acb8250681/frontend/src/pages/processes/utils.js)
- Item catalog (source of truth):
  [`frontend/src/pages/inventory/json/items.json`](https://github.com/democratizedspace/dspace/blob/fc840def24c5140411d2892f468960acb8250681/frontend/src/pages/inventory/json/items.json)

### Cookie schema (authoritative)

| Key pattern                    | Example key                       | Value format                             | Meaning                                              | Written when                                                                  | Notes                                                                                         |
| ------------------------------ | --------------------------------- | ---------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `acceptedCookies`              | `acceptedCookies`                 | String literal `true`                    | Cookie consent accepted                              | `GET /accepted_cookies` writes `Set-Cookie`                                   | Triggered via `/accept_cookies`; no explicit `path` is set in v1; other cookies use `path=/`. |
| `quest-<questId>-finished`     | `quest-3-finished`                | Date string (`Date.toString()`)          | Marks a quest as completed                           | `/quests/finish/[questId]` if cookies accepted                                | v1 quest IDs are numeric. Skip migration by default due to slug mismatch in v2/v3.            |
| `checkpoint-<questId>`         | `checkpoint-3`                    | Integer step ID (string)                 | Last checkpoint for a quest                          | `/quests/play/[questId]/[stepId]` when `checkpoint=true` and cookies accepted | Used for mid-quest resume; not migrated by default.                                           |
| `item-<itemId>`                | `item-12`                         | Numeric string (parsed via `parseFloat`) | Inventory counts for non-currency items              | Inventory changes: quests, processes, buy/sell                                | Currency items use `currency-balance-<symbol>` instead.                                       |
| `currency-balance-<symbol>`    | `currency-balance-dUSD`           | Numeric string (parsed via `parseFloat`) | Wallet balance for currency items                    | Wallet updates via buy/sell + `addWalletBalance` / `burnCurrency`             | v1 only defines `dUSD` as a currency item.                                                    |
| `process-<processId>-cooldown` | `process-3dprint-benchy-cooldown` | Date string (`Date.toString()`)          | Prevents re-running processes until cooldown expires | `finalizeProcess` in process utils                                            | Read on each process page to block early reruns.                                              |

### localStorage schema (authoritative)

| Key pattern                     | Example key                        | Value format                                   | Meaning                            | Written when                                            | Notes                                                      |
| ------------------------------- | ---------------------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------- |
| `process-<processId>-starttime` | `process-3dprint-benchy-starttime` | Milliseconds since epoch (`Date.now()` number) | Start timestamp for process timer  | `startProcess()` in `process.svelte`                    | Removed on finalize; used to resume progress after reload. |
| `machine-lock-<machineId>`      | `machine-lock-0`                   | Integer count (string)                         | Locks machines while processes run | `lockMachine()` / `unlockMachine()` in `process.svelte` | Decremented to 0, then removed.                            |

### Cookie write gate: `acceptedCookies` + redirect UX

- v1 sets `acceptedCookies=true` in `/accepted_cookies`, which is linked from the
  `/accept_cookies` prompt. The accepted page optionally renders a “Go back” link using the
  `redirect` query param. This is the only place that writes `acceptedCookies`.
- Quest completion + checkpoint cookies are only written when `hasAcceptedCookies()` returns
  `true`, which is why the v1 UI prompts users to accept cookies before tracking progress.

### How to inspect a v1 save (DevTools)

1. Open DevTools → **Application** tab.
2. In **Cookies**, select the site origin and filter for `item-`, `currency-balance-`, `quest-`, and
   `checkpoint-`.
3. In **Local Storage**, inspect keys that start with `process-` and `machine-lock-`.

**Example cookie header fragment (copy/pasteable):**

```
acceptedCookies=true; item-3=12.5; item-10=2; item-22=500; currency-balance-dUSD=123.45; quest-1-finished=Mon Jan 01 2024 00:00:00 GMT+0000 (Coordinated Universal Time); checkpoint-1=2
```

## V1 seed profiles for `/settings`

Use these profiles to seed sample v1 data (manual DevTools or the `/settings` seeder UI). They are
implementation-ready key/value sets that mirror the v1 format above.

### Minimal seed (cookies only)

**Cookies to set:**

```
acceptedCookies=true
item-3=12.5
item-10=2
item-20=3
item-22=150
item-70=1
currency-balance-dUSD=123.45
```

**Expected v3 detection outcomes:**

- **Legacy save banner** appears (v1 `item-` cookies present).
- **/settings → Legacy save upgrades** shows a V1 card with the items listed above.
- **Currency balance:** v3 detection only parses `item-<id>` cookies today, so
  `currency-balance-dUSD` is **not surfaced** in the V1 UI. Verify the balance via DevTools and
  treat this as a TODO in `detectV1CookieItems()` (`frontend/src/utils/legacySaveDetection.ts`) if
  currency migration is required.

### Maximal seed (cookies + localStorage)

**Cookies to set:**

```
acceptedCookies=true
item-3=12.5
item-10=2
item-20=3
item-22=150
item-70=1
currency-balance-dUSD=123.45
quest-1-finished=Mon Jan 01 2024 00:00:00 GMT+0000 (Coordinated Universal Time)
checkpoint-1=2
```

**LocalStorage to set:**

```
process-3dprint-benchy-starttime=1700000000000
machine-lock-0=1
```

**Expected v3 detection outcomes:**

- Same as minimal seed for **banner + V1 card** (v1 detection keys are cookie-based).
- `quest-` and `checkpoint-` cookies may be detected for QA purposes but remain **out of scope**
  for migration by default.
- `process-` and `machine-lock-` localStorage keys are **not migrated**; they exist solely for
  timer/lock state in v1 and should not affect v3 detection.

## QA: v1 → v3 migration checklist

1. **Start clean:** clear IndexedDB + localStorage + cookies. Confirm **no legacy banner** appears.
2. **Seed minimal v1 cookies** (above), reload, and confirm the **Legacy save detected** banner
   appears on non-settings pages and links to `/settings`.
3. **Check V1 detection UI:** in `/settings` → **Legacy save upgrades**, confirm:
    - The V1 card lists item counts from `item-<id>` cookies.
    - `currency-balance-dUSD` is not parsed by v1 detection (only `item-<id>` cookies are read); use
      DevTools to confirm balances until `detectV1CookieItems()` adds currency support.
    - Quest/progress cookies (if present) are labeled “not migrated” or ignored.
4. **Merge v1 into v3:** click **Merge v1 into current save**.
    - Inventory gains the seeded items.
    - Wallet balances are **not** migrated today; currency cookies are not parsed or cleared by the
      v1 flow.
    - Detected `item-<id>` cookies are expired after merge; reloading should remove the V1 banner.
    - If you re-seed the cookies and merge again, counts should increase again (merge is additive).
5. **Maximal seed case:** repeat with the maximal profile and confirm the same results, plus
   ensure process timers and machine locks remain ignored.
6. **Hand-off to v2.1 → v3:** after finishing v1 validation, continue with the v2.1 → v3 QA
   checklist in the section below. That section is the canonical v2.1 migration guide and
   supersedes any earlier high-level v2 migration notes.

## DSPACE v2.1 save format (commit `d956e807c26006b98227a89ca5039e4ed71fe2df`)

> **Source note:** This section is based on the audited v2.1 commit output provided for this doc
> update. Where details are not directly verified in this checkout, they are explicitly labeled
> **Observed in audit output** and paired with pinned file paths for review.

### A) High-level summary (v3-focused)

- **Single authoritative blob:** v2.1 stores the canonical save as
  `localStorage["gameState"]` (JSON), initialized to
  `{ quests: {}, inventory: {}, processes: {} }`. (**Observed in audit output**; see v2.1
  `frontend/src/utils/gameState/common.js` in the audit snapshot.)
- **No IndexedDB in v2.1:** migration to v3 must treat localStorage as the source of truth.
  (**Observed in audit output**.)
- **v3 migration target:** v3 moves legacy v2 localStorage data into IndexedDB; QA should verify
  the v2 → v3 upgrade flow rather than relying on v2 exports. (See v3 `importV2V3` in
  `frontend/src/utils/gameState.js`.)  
  <https://github.com/democratizedspace/dspace/blob/v3/frontend/src/utils/gameState.js>
- **Versioning is manual:** `versionNumberString` exists, but is only set by v2.1 importer/update
  helpers—not automatically on every save. (**Observed in audit output**; see v2.1
  `frontend/src/utils/gameState.js` + `frontend/src/components/svelte/Updater.svelte` in the
  audit snapshot.)
- **Synchronous writes:** every save writes immediately via
  `localStorage.setItem("gameState", JSON.stringify(gameState))`. (**Observed in audit output**;
  see v2.1 `frontend/src/utils/gameState/common.js` in the audit snapshot.)
- **Exporter/importer bugs exist:** v2.1 export can be stale and the v1→v2 importer has a known
  overwrite bug. v3 migration should **not** trust the exporter and must read from
  `localStorage["gameState"]`. (**Observed in audit output**; details below.)

### B) localStorage schema table (authoritative)

> **Note:** v2.1 does **not** use IndexedDB or sessionStorage. Only the keys below were found in
> the audited output.

| Key (or pattern)            | Example                                               | Value format / schema               | Meaning                  | Written by (v2.1 file + function)                                                         | Read by (v2.1 file + function)                                                            | Notes / edge cases                                                                                                                      |
| --------------------------- | ----------------------------------------------------- | ----------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `gameState`                 | `{"quests":{},"inventory":{"24":100},"processes":{}}` | JSON object (see deep schema below) | Canonical v2.1 save blob | `frontend/src/utils/gameState/common.js` → `saveGameState` (**Observed in audit output**) | `frontend/src/utils/gameState/common.js` → `loadGameState` (**Observed in audit output**) | Single source of truth; no `gameStateBackup` in v2.1. Exporter uses a module snapshot that can go stale (**Observed in audit output**). |
| `avatarUrl`                 | `https://example.com/avatar.png`                      | String URL                          | Selected avatar image    | **Observed in audit output**; v2.1 writer not confirmed in this checkout                  | **Observed in audit output**; v2.1 reader not confirmed in this checkout                  | Present in v2.1 localStorage; verify exact UI path in v2.1 if needed.                                                                   |
| `ethAddress`                | `0x1111111111111111111111111111111111111111`          | String hex address                  | Ethereum profile address | **Observed in audit output**; v2.1 writer not confirmed in this checkout                  | **Observed in audit output**; v2.1 reader not confirmed in this checkout                  | Present in v2.1 localStorage; not referenced in v3 codebase. Treat as legacy data only.                                                 |
| `sessionStorage` (all keys) | N/A (not used in v2.1)                                | N/A (not used in v2.1)              | None observed in v2.1    | None                                                                                      | None                                                                                      | **Observed in audit output:** no sessionStorage usage found.                                                                            |

**IndexedDB:** none in v2.1 (**Observed in audit output**).

### C) `gameState` deep schema (explicit)

```json
{
    "quests": {
        "<questId>": {
            "finished": true,
            "stepId": "string-or-number",
            "itemsClaimed": ["<questId>-<stepId>-<optionIndex>"]
        }
    },
    "inventory": {
        "<itemId>": 1,
        "<itemId>": 5.5
    },
    "processes": {
        "<processId>": { "startedAt": 1699999999000, "duration": 86400000 }
    },
    "versionNumberString": "2",
    "openAI": { "apiKey": "string" },
    "<otherKeys>": "allowed"
}
```

- **Inventory counts are floats:** `inventory` values are parsed with `parseFloat`, so fractional
  counts are valid. (**Observed in audit output**.)
- **Process timers:** `processes[processId]` stores `startedAt` and `duration` in epoch
  milliseconds. (**Observed in audit output**.)
- **Quest duplication guard:** `itemsClaimed` is used as a per-step guard to prevent re-granting
  rewards. (**Observed in audit output**.)
- **Extra keys tolerated:** v2.1 can persist extra keys under `gameState`; validate v3 migration in
  QA to ensure unknown keys are ignored safely. (**Observed in audit output**.)
- **Cleanup artifact:** the v2.1 import cleanup can write an empty-string inventory key. Treat
  `inventory[""]` as a historical artifact; observed values include `null`. (**Observed in audit
  output**.)

### D) Cookie usage in v2.1 (and v1 residue)

| Cookie key/pattern          | Example                        | Meaning in v2.1               | Notes                                                                                                                                                                                                                 |
| --------------------------- | ------------------------------ | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `acceptedCookies`           | `acceptedCookies=true`         | Legacy consent cookie from v1 | **Observed in audit output:** v2.1 does not otherwise use this except via v1 import flow.                                                                                                                             |
| `item-<id>`                 | `item-12=5`                    | v1 inventory counts           | v2.1 importer reads these for v1→v2 import. (**Observed in audit output**.)                                                                                                                                           |
| `currency-balance-<symbol>` | `currency-balance-dUSD=123.45` | v1 currency balance           | **Observed in audit output:** v2.1 importer does **not** read these; treat as v1 residue only. Helpers exist but v2.1 does not write new balances; shop pages reportedly only display balances (must verify in v2.1). |
| `longTaskDone`              | `longTaskDone=true`            | v2.1 `/task` flow flag        | **Observed in audit output**; scoped to `/task`.                                                                                                                                                                      |
| _Import cleanup_            | —                              | Deletes **all** cookies       | v2.1 import completion clears every cookie, regardless of prefix. See `frontend/src/pages/import/[newVersion]/[oldVersion]/done.astro` in the audit snapshot. (**Observed in audit output**.)                         |

## v1 → v2.1 importer behavior (v2.1)

This section documents the historical v1→v2 importer so v3 QA does not assume ideal behavior.
All details below are **Observed in audit output** unless otherwise noted.

**Route + entry points**

- Route: `/import/v2/v1` (audit path: `frontend/src/pages/import/[newVersion]/[oldVersion].astro`)
- Svelte UI: `frontend/src/pages/import/svelte/Importer.svelte` (audit snapshot)
- Migration helper: `frontend/src/utils/gameState.js` (audit snapshot)

**Trigger conditions + UI gating**

- Importer blocks if `getVersionNumber()` returns `"2"`. (See
  `frontend/src/pages/import/svelte/Importer.svelte` in the audit snapshot.)
- The menu entry “Import from v1” is hidden when the user owns item **85** (Early Adopter Token)
  or **86** (Newcomer Token). (See `frontend/src/config/menu.json` in the audit snapshot.)

**Inputs**

- Only v1 `item-<id>` cookies are read (`getCookieItems`); v1 currency cookies and other legacy
  state are ignored. (**Observed in audit output**.)
- **No item ID remapping:** v2.1 retains numeric item IDs and the importer assumes IDs match v1.
  (**Observed in audit output**.)

**Outputs**

- Adds items from cookies plus the **Early Adopter Token (85)**, sets
  `versionNumberString = "2"`, and writes the save. (See
  `frontend/src/utils/gameState.js` in the audit snapshot.)
- If no v1 data exists, the UI grants **Newcomer Token (86)** instead. (**Observed in audit
  output**.)

**Scope exclusions (not imported)**

- v1 currency balances (`currency-balance-<symbol>`)
- v1 quest cookies (`quest-`, `checkpoint-`)
- v1 process timers (`process-` / `machine-lock-` localStorage)
- `acceptedCookies`

**Known issues / pitfalls (v2.1)**

- **Importer overwrite bug:** `importV1V2` calls `addItems([...])`, then `setVersionNumber("2")`,
  then calls `saveGameState(gameState)` using the **pre-import snapshot**, likely overwriting the
  imported items + version. (See `frontend/src/utils/gameState.js` in the audit snapshot.)
- **Cleanup writes empty inventory id:** `Cleanup.svelte` writes an empty-id item to gameState.
  (See `frontend/src/pages/import/svelte/Cleanup.svelte` in the audit snapshot.)
- **Cleanup deletes all cookies:** v2.1 import completion removes every cookie. (See
  `frontend/src/pages/import/[newVersion]/[oldVersion]/done.astro` in the audit snapshot.)
- **Base64 exporter can be stale:** `exportGameStateString` uses a module-level snapshot that is
  not refreshed after initialization. (See `frontend/src/utils/gameState/common.js` in the audit
  snapshot.)

## Known v2.1 pitfalls relevant to v2 → v3 migration

Treat these as migration **warnings** and QA requirements, not guarantees of v3 behavior.

- **Exporter can be stale:** validate migration using `localStorage["gameState"]`, not the v2.1
  base64 export. (**Observed in audit output**.)
- **Importer overwrite bug:** some real saves may be missing items or version flags after import.
  Validate v3 migration against partial `quests`, `inventory`, or `processes` data in QA.
  (**Observed in audit output**.)
- **Unknown keys in gameState:** v2.1 does not enforce a strict schema; validate v3 migration
  against unknown keys in QA. (**Observed in audit output**.)
- **Cleanup artifacts:** import cleanup can leave `inventory[""]` and erase all cookies, so
  post-import saves may have odd artifacts or missing v1 residue. (**Observed in audit output**.)

## v2.1 seed profiles for `/settings` (v2 localStorage)

Use these to seed `localStorage["gameState"]` in DevTools or the `/settings` seeder. All JSON is
copy/pastable. **Do not use real secrets** (use `"REDACTED"` or placeholders).

### Seed 1: Minimal v2 save

```json
{ "quests": {}, "inventory": { "24": 100, "20": 5.5 }, "processes": {}, "versionNumberString": "2" }
```

**Expected v3 detection outcomes (verify in QA):**

- **Banner + settings card:** v3 legacy detection inspects `gameState`/`gameStateBackup`, then
  checks `versionNumberString` or `versionNumber` for a `1`/`2` prefix.  
  (v3: `detectLegacyArtifacts` + `LegacySaveUpgrade`.)  
  <https://github.com/democratizedspace/dspace/blob/v3/frontend/src/utils/legacySaveDetection.ts>  
  <https://github.com/democratizedspace/dspace/blob/v3/frontend/src/components/svelte/LegacySaveUpgrade.svelte>
- **Merge:** `mergeLegacyStateIntoCurrent` adds positive inventory counts, fills missing
  quest/process entries, merges settings (incoming values override current ones), grants the v2
  upgrade trophy, and persists the merged state via `persistMigratedState`.  
  <https://github.com/democratizedspace/dspace/blob/v3/frontend/src/utils/gameState.js>
- **Replace:** `importV2V3` validates the legacy state (provided or read from `gameState`), grants
  the v2 upgrade trophy, and persists via `persistMigratedState` (which sets
  `versionNumberString = "3"` and clears legacy localStorage when IndexedDB is in use).  
  <https://github.com/democratizedspace/dspace/blob/v3/frontend/src/utils/gameState.js>

### Seed 2: In-progress process save

**Note:** `quest/launch` and `processes/benchy` are **synthetic example keys** for QA seeding; use
real v3 IDs as needed.

```json
{
    "quests": { "quest/launch": { "stepId": "midpoint" } },
    "inventory": { "24": 42, "31": 1 },
    "processes": { "processes/benchy": { "startedAt": 1700000000000, "duration": 86400000 } },
    "versionNumberString": "2"
}
```

**Expected v3 detection outcomes (verify in QA):**

- **Banner + settings card:** legacy v2 detected as above.  
  <https://github.com/democratizedspace/dspace/blob/v3/frontend/src/components/svelte/LegacySaveUpgrade.svelte>
- **Merge:** `mergeLegacyStateIntoCurrent` adds positive inventory counts and only fills missing
  quest/process entries; settings merge with incoming values overriding current entries.  
  <https://github.com/democratizedspace/dspace/blob/v3/frontend/src/utils/gameState.js>
- **Replace:** `importV2V3` validates and persists the legacy state as the new v3 save (including
  `versionNumberString = "3"` via `persistMigratedState`).  
  <https://github.com/democratizedspace/dspace/blob/v3/frontend/src/utils/gameState.js>
- **Finished processes:** in v2.1, the `processes` map only contains in-progress entries with
  `startedAt` and `duration`. When a process finishes, its entry is removed rather than persisted
  with a `finished: true` flag. (**Observed in audit output**.)

### Seed 3: “Messy real-world” save

**Note:** `quest/messy` is a **synthetic example key** for QA seeding; use real v3 IDs as needed.

```json
{
    "quests": {
        "quest/messy": {
            "finished": true,
            "itemsClaimed": ["quest/messy-1-0"]
        }
    },
    "inventory": { "24": 12, "": null },
    "processes": {},
    "versionNumberString": "2",
    "openAI": { "apiKey": "REDACTED" },
    "extraLegacyKey": { "note": "ignored by v3" }
}
```

**Expected v3 detection outcomes (verify in QA):**

- **Banner + settings card:** legacy v2 detected.  
  <https://github.com/democratizedspace/dspace/blob/v3/frontend/src/components/svelte/LegacySaveUpgrade.svelte>
- **Merge:** `mergeLegacyStateIntoCurrent` ignores non-positive inventory counts (including the
  empty-string cleanup artifact), only fills missing quest/process entries, and does not copy
  arbitrary extra keys from the legacy state. The empty-string key with `null` represents a v2.1
  cleanup artifact and will be skipped because it normalizes to `0`.  
  <https://github.com/democratizedspace/dspace/blob/v3/frontend/src/utils/gameState.js>
- **Replace:** `importV2V3` validates and persists the legacy state; verify in QA that any extra
  keys do not disrupt migration.  
  <https://github.com/democratizedspace/dspace/blob/v3/frontend/src/utils/gameState.js>

## QA: v2.1 → v3 migration checklist

1. **Start clean:** clear IndexedDB + localStorage. Confirm **no legacy banner** appears on v3.
2. **Seed each v2.1 profile** above in `localStorage["gameState"]`; reload.
3. **Verify detection UI:** `/settings` → **Legacy save upgrades** shows “Legacy v2 localStorage
   data detected.”
4. **Merge into existing v3 save:** validate additive inventory behavior and that quests/processes
   are preserved (no overwrites).
5. **Replace into existing v3 save:** validate replacement behavior and that the v3 save is written
   to IndexedDB after import.
6. **Legacy data cleanup:** `persistMigratedState` removes `gameState` and `gameStateBackup` when
   IndexedDB is in use; confirm that behavior matches runtime storage mode (localStorage-only
   environments retain legacy keys).
7. **Failure cases:**
    - **Corrupt JSON** in `gameState` → expect clear UX, no crash, no data deletion.
    - **Partial `gameState`** (missing `quests`, `inventory`, or `processes`) → defaults restored,
      migration proceeds safely.
    - **Huge counts / many items** → migration completes without timeouts.

## V1 storage (cookies) vs v2/v3

### V2 storage (localStorage)

**Schema:** A JSON object stored under a single key in v2.1.

- **Keys:** `gameState` (v2.1). `gameStateBackup` is a v3-era fallback key but is still checked by
  v3 legacy detection. See the v2.1 format section above for the authoritative schema.
- **Payload:** JSON with `versionNumberString` beginning with `2`, plus `inventory`, `quests`, and
  `processes` (optional keys like `openAI` can also appear). Earlier internal docs also mentioned
  `settings` and `_meta` as possible fields, but those keys never shipped in any v2.x save format
  and can be ignored if encountered.
- **Example payload:**
    ```json
    {
        "versionNumberString": "2",
        "inventory": { "3": 120, "10": 2.5 },
        "quests": { "welcome/howtodoquests": { "finished": true } },
        "processes": { "processes/benchy": { "startedAt": 1700000000000, "duration": 86400000 } }
    }
    ```

**Code references:**

- Detection + legacy parsing:
  [`frontend/src/utils/legacySaveDetection.ts`](https://github.com/democratizedspace/dspace/blob/v3/frontend/src/utils/legacySaveDetection.ts)
  (`hasLegacyLocalStorage`).
- Fixture seed data:
  [`frontend/src/utils/legacySaveFixtures/legacy_v2_localstorage_save.json`](https://github.com/democratizedspace/dspace/blob/v3/frontend/src/utils/legacySaveFixtures/legacy_v2_localstorage_save.json).
- Merge/replace logic:
  [`frontend/src/utils/gameState.js`](https://github.com/democratizedspace/dspace/blob/v3/frontend/src/utils/gameState.js)
  (`importV2V3`, `mergeLegacyStateIntoCurrent`).

**DevTools inspection:**

- Application tab → Local Storage → `https://<host>`.
- Inspect `gameState` and `gameStateBackup` values (JSON).

### V3 storage (IndexedDB)

**Schema:** The canonical v3 save lives in IndexedDB, with localStorage used as a lightweight
backup and fallback for unsupported environments.

- **Database:** `dspaceGameState` (version `1`).
- **Object stores:** `state`, `backup`.
- **Key:** `root` (the game state blob is stored under a fixed key).
- **LocalStorage mirrors:** `gameState` and `gameStateBackup` are still written after every save to
  provide a recovery path when IndexedDB is unavailable.

**Code references:**

- IndexedDB constants and store layout:
  [`frontend/src/utils/gameState/common.js`](https://github.com/democratizedspace/dspace/blob/v3/frontend/src/utils/gameState/common.js)
  (`DB_NAME`, `DB_VERSION`, `STATE_STORE`, `BACKUP_STORE`, `ROOT_KEY`).
- Persistence + fallback behavior:
  [`frontend/src/utils/gameState/common.js`](https://github.com/democratizedspace/dspace/blob/v3/frontend/src/utils/gameState/common.js)
  (`read`, `write`, `warnFallback`).

**DevTools inspection:**

- Application tab → IndexedDB → `dspaceGameState` → `state` / `backup` → key `root`.
- Compare with localStorage fallback keys if IndexedDB is blocked (Safari private mode, etc.).

## Detection & upgrade flow

**Detection logic:**

- V1 cookies are detected on the client with `detectV1CookieItems(document.cookie)`.
- V2 localStorage detection reads `gameState` / `gameStateBackup` and checks that
  `versionNumberString` (or `versionNumber`) starts with `1` or `2`.
- Shared detection entry point:
  [`frontend/src/utils/legacySaveDetection.ts`](https://github.com/democratizedspace/dspace/blob/v3/frontend/src/utils/legacySaveDetection.ts)
  (`detectLegacyArtifacts`).

**Merge vs. replace semantics:**

- **V1 → V3:** `importV1V3` adds counts to the current inventory (merge) or rebuilds from scratch
  (replace) and grants the **Early Adopter Token** trophy if any v1 items were imported.
- **V2 → V3:** `importV2V3` replaces the current save with the legacy state, and
  `mergeLegacyStateIntoCurrent` combines inventory while preserving existing quests/processes.
- Both flows update `versionNumberString` to `3` and persist to IndexedDB.

**Cleanup behavior:**

- V1 cleanup expires each detected `item-<id>` cookie (see
  [`frontend/src/components/svelte/LegacySaveUpgrade.svelte`](https://github.com/democratizedspace/dspace/blob/v3/frontend/src/components/svelte/LegacySaveUpgrade.svelte)).
  Other legacy cookies (ex: `currency-balance-<symbol>`, `quest-`, `checkpoint-`) are not cleared.
- V2 cleanup deletes `gameState` / `gameStateBackup` during v2 → v3 migrations (when IndexedDB is
  in use) and also via the **Delete v2 localStorage** action in the Legacy Save Upgrade UI.

## QA seeding

QA seeding writes known-good fixtures that match the above schemas.

- **V1 seed:**
  [`frontend/src/utils/legacySaveSeeding.ts`](https://github.com/democratizedspace/dspace/blob/v3/frontend/src/utils/legacySaveSeeding.ts)
  reads
  [`frontend/src/utils/legacySaveFixtures/legacy_v1_cookie_save.json`](https://github.com/democratizedspace/dspace/blob/v3/frontend/src/utils/legacySaveFixtures/legacy_v1_cookie_save.json).
- **V2 seed:**
  [`frontend/src/utils/legacySaveSeeding.ts`](https://github.com/democratizedspace/dspace/blob/v3/frontend/src/utils/legacySaveSeeding.ts)
  reads
  [`frontend/src/utils/legacySaveFixtures/legacy_v2_localstorage_save.json`](https://github.com/democratizedspace/dspace/blob/v3/frontend/src/utils/legacySaveFixtures/legacy_v2_localstorage_save.json).

After seeding, use [`/settings`](/settings) → **Legacy save upgrades** to merge or replace, and
verify detection with the global legacy banner (shared detection logic).

## V1 item catalog (for mapping)

Source: [`frontend/src/pages/inventory/json/items.json`](https://github.com/democratizedspace/dspace/blob/fc840def24c5140411d2892f468960acb8250681/frontend/src/pages/inventory/json/items.json)

| itemId | name                                         | description                                                                                                                                                                                                     | type     | price        | symbol | unit |
| ------ | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------ | ------ | ---- |
| 0      | Real Printer 1                               | A basic cheap printer that is easy to use and has a large community of users.                                                                                                                                   | machine  | 200 dUSD     | —      | —    |
| 1      | Benchy                                       | A basic test print that is used to test the quality of a printer.                                                                                                                                               | 3dprint  | 5 dUSD       | —      | —    |
| 2      | hydroponics kit                              | A hydroponics tub with all the basic features you need to grow your own plants.                                                                                                                                 | —        | 30 dUSD      | —      | —    |
| 3      | white PLA filament                           | 1 gram of white PLA filament for an FDM printer.                                                                                                                                                                | —        | 0.02499 dUSD | —      | g    |
| 4      | Edison Model M                               | A futuristic electric vehicle with Fully Supervised Driving (FSD) capabilities.                                                                                                                                 | —        | 40000 dUSD   | —      | —    |
| 5      | portable solar panel                         | A portable solar panel that can be used to charge your devices. Supports USB-A and USB-C ports, and it has a 110V AC outlet, with support for 200W at peak sunpower.                                            | machine  | 200 dUSD     | —      | —    |
| 6      | 200 Wh battery pack                          | A 200 Wh battery pack that can be used to store energy from a solar panel or a wind turbine.                                                                                                                    | —        | 130 dUSD     | —      | —    |
| 7      | 500W wind turbine                            | A 500W wind turbine that can be used to generate electricity.                                                                                                                                                   | —        | 200 dUSD     | —      | —    |
| 8      | Benchy Award                                 | A trophy granted for printing your first Benchy.                                                                                                                                                                | —        | —            | —      | —    |
| 9      | Real Hydroponics Tub 1                       | A hydroponics tub with all the basic features you need to grow your own plants.                                                                                                                                 | machine  | 30 dUSD      | —      | —    |
| 10     | basil seeds                                  | A packet of basil seeds.                                                                                                                                                                                        | —        | 5 dUSD       | —      | —    |
| 11     | 3D printed model rocket                      | A 3D-printed model rocket that can be used to launch small payloads into space.                                                                                                                                 | 3dprint  | 25 dUSD      | —      | —    |
| 12     | green PLA filament                           | 1 gram of green PLA filament for an FDM printer.                                                                                                                                                                | —        | 0.02499 dUSD | —      | g    |
| 13     | hydroponic starter plug                      | 1 rockwool starter plug for hydroponic seed germination.                                                                                                                                                        | —        | 0.35 dUSD    | —      | —    |
| 14     | hydroponics nutrients                        | A bottle of hydroponics nutrients that can be used to grow plants. NPK: 9-3-6                                                                                                                                   | —        | 25 dUSD      | —      | L    |
| 15     | 3D printing kit                              | A kit that contains all the parts you need to get started with 3D printing. Everything is fully assembled.                                                                                                      | —        | —            | —      | —    |
| 16     | 5 gallon bucket                              | A 5 gallon bucket that can be used to store water or other liquids.                                                                                                                                             | —        | 8 dUSD       | —      | —    |
| 17     | 5 gallon bucket of tap water (chlorinated)   | A 5 gallon bucket of water. This water is chlorinated and should not be used for hydroponics.                                                                                                                   | machine  | —            | —      | —    |
| 18     | Motor Award                                  | A trophy granted for being one of the first people to buy an Edison Model M                                                                                                                                     | —        | —            | —      | —    |
| 19     | Rocket Award                                 | A trophy granted for printing your first model rocket.                                                                                                                                                          | —        | —            | —      | —    |
| 20     | dCarbon                                      | A token that is generated for every 1 kg of carbon dioxide generated in-game.                                                                                                                                   | —        | —            | —      | —    |
| 21     | Hypercar (80% charge)                        | A futuristic electric vehicle with Fully Supervised Driving (FSD) capabilities. 80% charged.                                                                                                                    | —        | —            | —      | —    |
| 22     | dWatt                                        | A token that represents 1 watt of electricity that can be consumed by machines. To acquire 1 dWatt, you need to either prepay the dCarbon cost, or generate and store it in a battery without accruing dCarbon. | —        | —            | —      | —    |
| 23     | Hypervan                                     | A futuristic electric van with Fully Supervised Driving (FSD) capabilities.                                                                                                                                     | —        | 75000 dUSD   | —      | —    |
| 24     | dUSD                                         | An in-game tokenized version of the USD currency. Not backed by or in any way associated with actual USD.                                                                                                       | currency | —            | dUSD   | —    |
| 25     | 5 gallon bucket of tap water (dechlorinated) | A 5 gallon bucket of water. This water is dechlorinated and can be used for hydroponics.                                                                                                                        | machine  | —            | —      | —    |
| 26     | soaked hydroponic starter plug               | A hydroponic starter plug soaked in water. Used to germinate seeds.                                                                                                                                             | machine  | —            | —      | —    |
| 27     | basil seedling                               | A basil seedling that has been germinated in a rockwool cube.                                                                                                                                                   | —        | —            | —      | —    |
| 28     | sink                                         | Generates tap water.                                                                                                                                                                                            | machine  | —            | —      | —    |
| 29     | smart plug                                   | A smart plug that plugs into a wall outlet to measure energy usage.                                                                                                                                             | machine  | —            | —      | —    |
| 30     | 3D printed nosecone                          | A nosecone for a modular model rocket.                                                                                                                                                                          | —        | —            | —      | —    |
| 31     | 3D printed body tube                         | A body tube for a modular model rocket.                                                                                                                                                                         | —        | —            | —      | —    |
| 32     | 3D printed fincan                            | A fincan for a modular model rocket.                                                                                                                                                                            | —        | —            | —      | —    |
| 33     | 3D printed nosecone coupler                  | A nosecone coupler for a modular model rocket.                                                                                                                                                                  | —        | —            | —      | —    |
| 34     | hobbyist solid rocket motor                  | 24mm in diameter, 95mm long, weighing 58.1g. Max thrust: 31.3 Newtons.                                                                                                                                          | —        | 10 dUSD      | —      | —    |
| 35     | superglue                                    | Don't get it on your hands!                                                                                                                                                                                     | machine  | 10 dUSD      | —      | —    |
| 36     | kevlar cord                                  | Perfect for model rocketry.                                                                                                                                                                                     | —        | 0.3 dUSD     | —      | m    |
| 37     | rocket igniter                               | Ignite a rocket motor with electricity.                                                                                                                                                                         | —        | 0.1 dUSD     | —      | —    |
| 38     | launch controller                            | A controller for launching model rockets.                                                                                                                                                                       | machine  | 20 dUSD      | —      | —    |
| 39     | launch-capable model rocket                  | A model rocket ready for launch. Ignite remotely using the launch controller.                                                                                                                                   | —        | —            | —      | —    |
| 40     | damaged model rocket                         | Badly damaged and broken in several places.                                                                                                                                                                     | —        | —            | —      | —    |
| 41     | Rocketeer Award                              | Awarded for launching your first rocket!                                                                                                                                                                        | —        | —            | —      | —    |
| 42     | harvestable basil plant                      | A basil plant that is ready to be harvested. Growing medium: rockwool.                                                                                                                                          | machine  | —            | —      | —    |
| 43     | hydroponic grow lamp                         | Nice pink lighting that completely changes the vibe of your room. Also used for growing plants. Energy consumption: 36W.                                                                                        | —        | 50 dUSD      | —      | —    |
| 44     | Real Hydroponics Tub 1 (ready)               | A hydroponic tub that is ready to be used. Contains a nutrient solution suitable for most leafy greens.                                                                                                         | machine  | —            | —      | —    |
| 45     | Real Hydroponics Tub 1 (nutrient deficient)  | A hydroponic tub that is ready to be used. Contains a nutrient solution suitable for most leafy greens.                                                                                                         | machine  | —            | —      | —    |
| 46     | bundle of basil leaves                       | A bundle of basil leaves. Maybe we can make pesto in the future? For now, maybe just sell it.                                                                                                                   | —        | 3 dUSD       | —      | —    |
| 47     | harvested basil plant                        | A basil plant that has been freshly harvested. Don't worry, it'll grow back eventually!                                                                                                                         | —        | —            | —      | —    |
| 48     | Green Thumb Award                            | Awarded for growing and harvesting your first batch of hydroponic basil!                                                                                                                                        | —        | —            | —      | —    |
| 49     | Solarpunk Award                              | Awarded for generating dWatt using solar panels!                                                                                                                                                                | —        | —            | —      | —    |
| 50     | Completionist Award                          | Awarded for completing all of the quests available on January 1, 2023.                                                                                                                                          | —        | —            | —      | —    |
| 51     | aquarium (150 L)                             | A glass tank for housing fish.                                                                                                                                                                                  | machine  | 60 dUSD      | —      | —    |
| 52     | aquarium (goldfish) (150 L)                  | An aquarium containing a goldfish.                                                                                                                                                                              | machine  | —            | —      | —    |
| 53     | goldfish                                     | A goldfish.                                                                                                                                                                                                     | —        | 10 dUSD      | —      | —    |
| 54     | goldfish food                                | Food suitable for a goldfish.                                                                                                                                                                                   | —        | 10 dUSD      | —      | —    |
| 55     | aquarium filter                              | A filter for a fish tank.                                                                                                                                                                                       | —        | 30 dUSD      | —      | —    |
| 56     | aquarium heater                              | A heater for a fish tank.                                                                                                                                                                                       | —        | 20 dUSD      | —      | —    |
| 57     | aquarium light                               | A light for a fish tank.                                                                                                                                                                                        | —        | 15 dUSD      | —      | —    |
| 58     | Thermometer                                  | A thermometer for measuring temperature.                                                                                                                                                                        | —        | 15 dUSD      | —      | —    |
| 59     | pH strip                                     | A pH strip for measuring pH.                                                                                                                                                                                    | —        | 0.15 dUSD    | —      | —    |
| 60     | 7 pH freshwater aquarium (150 L)             | An freshwater aquarium with a pH of 7.                                                                                                                                                                          | machine  | —            | —      | —    |
| 61     | dSolar                                       | a token that represents 1 Watt of energy generated using a solar panel.                                                                                                                                         | —        | —            | —      | —    |
| 62     | gravel                                       | Loose gravel suitable for use in an aquarium.                                                                                                                                                                   | —        | 1 dUSD       | —      | kg   |
| 63     | aquarium net                                 | A net for catching fish.                                                                                                                                                                                        | —        | 5 dUSD       | —      | —    |
| 64     | dGoldfish                                    | A token granted for feeding a goldfish                                                                                                                                                                          | —        | —            | —      | —    |
| 65     | Fish Friend Award                            | An award given for setting up your first goldfish aquarium.                                                                                                                                                     | —        | —            | —      | —    |
| 66     | parachute                                    | A parachute for model rockets.                                                                                                                                                                                  | —        | 30 dUSD      | —      | —    |
| 67     | launch-capable model rocket (parachute)      | A reusable rocket with a parachute                                                                                                                                                                              | —        | —            | —      | —    |
| 68     | Rocket Descent (animated)                    | A rocket descending to the ground with a parachute.                                                                                                                                                             | —        | —            | —      | —    |
| 69     | dLaunch                                      | 1 dLaunch = 1 launch of a rocket. Any launch counts, even a model rocket launch.                                                                                                                                | —        | —            | —      | —    |
| 70     | dOffset                                      | 1 dOffset is granted for reducing dCarbon with dUSD.                                                                                                                                                            | —        | —            | —      | —    |
| 71     | Tree Hugger Award                            | Awarded for converting dCarbon to dOffset.                                                                                                                                                                      | —        | —            | —      | —    |
| 72     | dBI                                          | Awarded for every dUSD earned through Basic Income. See the Wallet page for more details.                                                                                                                       | —        | —            | —      | —    |
| 73     | EV charger                                   | A charger for electric vehicles.                                                                                                                                                                                | —        | 500 dUSD     | —      | —    |
| 74     | Hypercar (20% charge)                        | A futuristic electric vehicle with Fully Supervised Driving (FSD) capabilities. 20% charged.                                                                                                                    | —        | 30000 dUSD   | —      | —    |
| 75     | Hypercar (animated)                          | A hypercar driving down the road.                                                                                                                                                                               | —        | —            | —      | —    |
| 76     | 1 kWh battery pack                           | A 1kWh Wh battery pack that can be used to store energy from a solar panel or a wind turbine.                                                                                                                   | —        | 1000 dUSD    | —      | —    |
| 77     | The grass is always greener (still)          | A still image of a Hypercar on a grassy field.                                                                                                                                                                  | —        | —            | —      | —    |
