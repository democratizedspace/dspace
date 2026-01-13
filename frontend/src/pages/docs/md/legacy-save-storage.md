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

## QA: v1 → v2 → v3 migration checklist

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
6. **Hand-off to v2 → v3:** v2 migration audit lives elsewhere; keep this run focused on v1 data
   before testing any v2 localStorage conversions.

## DSPACE v2.1 save format (commit `d956e807c26006b98227a89ca5039e4ed71fe2df`)

**High-level summary (v3-focused)**

- **Primary save blob:** v2.1 persists everything in `localStorage["gameState"]` (single JSON blob).
  There is **no IndexedDB usage** in v2.1. (Observed in audit output; see v2.1 links below.)
- **Migration note:** v3 migrates from legacy localStorage into IndexedDB. Because v2.1 has
  known exporter/importer bugs, **treat `gameState` as the source of truth** during v2 → v3 QA
  (avoid validating against v2.1 exports).
- **Versioning:** v2.1 does not auto-manage versions. `versionNumberString` is only set by the
  v1 → v2 importer or the updater component.

**Primary v2.1 source files (commit `d956e807...`):**

- `gameState` load/save + base64 export:
  [`frontend/src/utils/gameState/common.js`](https://github.com/democratizedspace/dspace/blob/d956e807c26006b98227a89ca5039e4ed71fe2df/frontend/src/utils/gameState/common.js)
- Version helpers + importer:
  [`frontend/src/utils/gameState.js`](https://github.com/democratizedspace/dspace/blob/d956e807c26006b98227a89ca5039e4ed71fe2df/frontend/src/utils/gameState.js)
- Version updater component:
  [`frontend/src/components/svelte/Updater.svelte`](https://github.com/democratizedspace/dspace/blob/d956e807c26006b98227a89ca5039e4ed71fe2df/frontend/src/components/svelte/Updater.svelte)

### localStorage schema table (authoritative)

| Key (or pattern) | Example | Value format / schema | Meaning | Written by (v2.1 file + function) | Read by (v2.1 file + function) | Notes / edge cases |
| --- | --- | --- | --- | --- | --- | --- |
| `gameState` | `{ "quests": {}, "inventory": {}, "processes": {} }` | JSON object (see deep schema below) | Canonical v2.1 save | `frontend/src/utils/gameState/common.js` `saveGameState()` | `frontend/src/utils/gameState/common.js` `loadGameState()` | No built-in versioning. Exporter reads a module-level snapshot that can be stale. |
| `avatarUrl` | `https://.../pfp.jpg` | String URL | Selected avatar | `frontend/src/components/svelte/AvatarPicker.svelte` | `frontend/src/components/svelte/Avatar.svelte`, `Menu.svelte`, `QuestChat.svelte` | Stored separately from `gameState`. |
| `ethAddress` | `0x1234...` | String | Connected wallet address | `frontend/src/components/svelte/EthProfile.svelte` | `frontend/src/components/svelte/EthProfile.svelte` | Stored separately from `gameState`. |
| `sessionStorage` | — | N/A | None found in v2.1 | — | — | No sessionStorage usage in the v2.1 audit. |

**No IndexedDB:** `indexedDB` is not referenced in the v2.1 codebase (audit result).

### `gameState` deep schema (explicit)

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
    "<itemId>": 0.0
  },
  "processes": {
    "<processId>": { "startedAt": 1700000000000, "duration": 600000 }
  },
  "versionNumberString": "1" | "2",
  "openAI": { "apiKey": "string" }
}
```

Notes:

- **Inventory counts are floats** (counts are added/subtracted with `parseFloat` in v2.1).
- **Process timers** use epoch milliseconds + duration in milliseconds.
- **Quest `itemsClaimed`** is used as a per-step duplication guard in v2.1 (array of
  `<questId>-<stepId>-<optionIndex>` keys).
- **Extra keys are tolerated** in v2.1 (imports/cleanup can inject unexpected entries).

### Cookie usage in v2.1 (and v1 residue)

| Cookie key / pattern | Example | Used by v2.1? | Purpose | Evidence (v2.1 commit link) | Notes |
| --- | --- | --- | --- | --- | --- |
| `acceptedCookies` | `acceptedCookies=true` | Legacy only | v1 cookie consent flag | [`frontend/src/utils.js`](https://github.com/democratizedspace/dspace/blob/d956e807c26006b98227a89ca5039e4ed71fe2df/frontend/src/utils.js) | Not referenced elsewhere in v2.1 UI. |
| `item-<id>` | `item-24=100` | **Yes** | v1 inventory cookie import | [`frontend/src/utils.js`](https://github.com/democratizedspace/dspace/blob/d956e807c26006b98227a89ca5039e4ed71fe2df/frontend/src/utils.js) | Only v1 cookies read by v2.1 importer. |
| `currency-balance-<symbol>` | `currency-balance-dUSD=5` | No | v1 currency helper exists | [`frontend/src/utils.js`](https://github.com/democratizedspace/dspace/blob/d956e807c26006b98227a89ca5039e4ed71fe2df/frontend/src/utils.js) | v2.1 does not import these balances. |
| `longTaskDone` | `longTaskDone=<date>` | Yes (isolated) | Task timer cookie | [`frontend/src/pages/task.astro`](https://github.com/democratizedspace/dspace/blob/d956e807c26006b98227a89ca5039e4ed71fe2df/frontend/src/pages/task.astro) | Only used on `/task`. |
| *(cleanup: all cookies)* | — | Yes | Delete all cookies on v1 cleanup | [`frontend/src/pages/import/[newVersion]/[oldVersion]/done.astro`](https://github.com/democratizedspace/dspace/blob/d956e807c26006b98227a89ca5039e4ed71fe2df/frontend/src/pages/import/[newVersion]/[oldVersion]/done.astro) | Deletes **all cookies**, not just v1 keys. |

## v1 → v2 importer behavior (v2.1)

**Route + location**

- Route: `/import/v2/v1`.
- Astro page: `frontend/src/pages/import/[newVersion]/[oldVersion].astro` (loads importer).
- Svelte importer UI: `frontend/src/pages/import/svelte/Importer.svelte`.

**Trigger conditions + UI gating**

- Importer reads cookies via `getCookieItems(cookie)` and blocks if `getVersionNumber() === "2"`.
- Menu entry **Import from v1** is hidden if the player owns item 85 (Early Adopter Token) or 86
  (Newcomer Token).

**Inputs**

- **Only** v1 `item-<id>` cookies (positive numeric values) are parsed and passed to import.
- v1 currency cookies (`currency-balance-<symbol>`) are ignored by the importer.

**Outputs**

- Adds the **Early Adopter Token** (item 85) plus every imported cookie item.
- Sets `versionNumberString = "2"`.
- **No v1 data** path: if zero items are found, the UI offers the **Newcomer Token** (item 86)
  instead of importing.
- **Item ID mapping:** v2.1 uses the same numeric item IDs as v1; the importer does no remapping.

**Scope exclusions (not imported)**

- Currency balances (`currency-balance-*` cookies).
- Quest progress or checkpoints.
- Process timers.
- `acceptedCookies` flag.

**Known issues / pitfalls (v2.1)**

- **Importer overwrite bug:** `importV1V2()` loads `gameState`, adds items, sets version, then
  calls `saveGameState(gameState)` using the **pre-import snapshot**, which can overwrite the
  new items and version flag.
- **Cleanup writes an empty-id inventory entry** (`{ id: "" }`) during the “Remove v1” step.
- **Cleanup deletes every cookie**, not just legacy v1 cookies.
- **Base64 export can be stale:** `exportGameStateString()` reads a module-level snapshot that is
  not updated after initialization.

**Evidence links (v2.1 commit, pinned)**

- Import route + cookie parsing:
  [`frontend/src/pages/import/[newVersion]/[oldVersion].astro`](https://github.com/democratizedspace/dspace/blob/d956e807c26006b98227a89ca5039e4ed71fe2df/frontend/src/pages/import/[newVersion]/[oldVersion].astro),
  [`frontend/src/utils.js`](https://github.com/democratizedspace/dspace/blob/d956e807c26006b98227a89ca5039e4ed71fe2df/frontend/src/utils.js)
- Importer UI behavior + newcomer item reward:
  [`frontend/src/pages/import/svelte/Importer.svelte`](https://github.com/democratizedspace/dspace/blob/d956e807c26006b98227a89ca5039e4ed71fe2df/frontend/src/pages/import/svelte/Importer.svelte)
- Import implementation + version flag:
  [`frontend/src/utils/gameState.js`](https://github.com/democratizedspace/dspace/blob/d956e807c26006b98227a89ca5039e4ed71fe2df/frontend/src/utils/gameState.js)
- Menu gating for items 85/86:
  [`frontend/src/config/menu.json`](https://github.com/democratizedspace/dspace/blob/d956e807c26006b98227a89ca5039e4ed71fe2df/frontend/src/config/menu.json)
- Cleanup cookie wipe + empty-id item:
  [`frontend/src/pages/import/[newVersion]/[oldVersion]/done.astro`](https://github.com/democratizedspace/dspace/blob/d956e807c26006b98227a89ca5039e4ed71fe2df/frontend/src/pages/import/[newVersion]/[oldVersion]/done.astro),
  [`frontend/src/pages/import/svelte/Cleanup.svelte`](https://github.com/democratizedspace/dspace/blob/d956e807c26006b98227a89ca5039e4ed71fe2df/frontend/src/pages/import/svelte/Cleanup.svelte)
- Base64 export snapshot:
  [`frontend/src/utils/gameState/common.js`](https://github.com/democratizedspace/dspace/blob/d956e807c26006b98227a89ca5039e4ed71fe2df/frontend/src/utils/gameState/common.js)

## Known v2.1 pitfalls relevant to v2 → v3 migration

- **Stale exporter output:** v2.1 `exportGameStateString()` can return stale data. QA should
  validate migration against `localStorage["gameState"]`, not against v2.1 exports.
- **Importer overwrite bug:** some real users may have partial v2.1 states (missing items or
  missing `versionNumberString`). v3 migration should tolerate missing or partial keys.
- **Unknown keys:** v2.1 writes ad-hoc keys under `gameState` (including empty-string inventory
  IDs from cleanup). v3 should ignore unknown keys safely.
- **Cookie wipe:** v1 → v2 cleanup deletes every cookie, so v2.1 saves after import may have
  missing or unexpected cookie artifacts.

## v2.1 seed profiles for `/settings` (v2 localStorage)

Seed these directly into `localStorage["gameState"]` to exercise the v2 → v3 upgrade UI.
All profiles include `versionNumberString: "2"` so the v3 legacy banner can detect them.
Detection uses `detectLegacyArtifacts`, which only flags v2 localStorage when the version string
starts with `1` or `2`.

### Minimal v2 save (int + float counts)

```json
{"quests":{},"inventory":{"24":100,"20":5.5},"processes":{},"versionNumberString":"2"}
```

**Expected v3 detection outcome**

- **Legacy save banner** should appear (v2 localStorage detected).
- `/settings` → **Legacy save upgrades** shows **V2 (localStorage saves)** with
  “Legacy v2 localStorage data detected.”

**Expected merge/replace**

- **Merge:** inventory counts add to the current v3 inventory; existing quests/processes remain.
- **Replace:** v3 save becomes the v2 inventory and empty quests/processes shown above.
- **Wallet UI:** confirm dUSD (item 24) matches the inventory count (must verify in QA).

### In-progress process save

```json
{
  "quests": { "launch/intro": { "stepId": "2" } },
  "inventory": { "24": 250, "3": 12 },
  "processes": { "processes/benchy": { "startedAt": 1705600000000, "duration": 900000 } },
  "versionNumberString": "2"
}
```

**Expected v3 detection outcome**

- Same banner + V2 card as the minimal profile.

**Expected merge/replace**

- **Merge:** inventory adds; existing v3 quests/processes are kept (v2 quest/process entries
  only fill gaps).
- **Replace:** v3 state becomes the v2 quest step + process timer above.
- **Wallet UI:** confirm dUSD (item 24) matches the inventory count (must verify in QA).

### “Messy real-world” save (unknown keys + cleanup artifact)

```json
{
  "quests": { "hydroponics/start": { "finished": true, "itemsClaimed": ["hydroponics/start-1-0"] } },
  "inventory": { "": null, "24": 42, "20": 0.25 },
  "processes": {},
  "versionNumberString": "2",
  "openAI": { "apiKey": "REDACTED" },
  "unexpectedKey": { "note": "legacy data drift" }
}
```

**Expected v3 detection outcome**

- Same banner + V2 card as above.

**Expected merge/replace**

- **Merge:** inventory adds only valid counts; unknown keys are ignored; quests/processes keep
  existing v3 entries where present.
- **Replace:** v3 state should ignore unknown keys and treat empty-string inventory as a
  no-op (verify in QA).
- **Wallet UI:** confirm dUSD (item 24) matches the inventory count (must verify in QA).

> **Note:** Do not store real secrets in docs. The `openAI.apiKey` field is included to test
> v2 parsing only.

## QA: v2.1 → v3 migration checklist

1. **Start clean:** clear IndexedDB + localStorage. Confirm **no legacy banner** appears.
2. **Seed each v2 profile** above into `localStorage["gameState"]`; reload.
3. **Verify detection UI** on `/settings` → **Legacy save upgrades**:
    - V2 card reads **Legacy v2 localStorage data detected**.
    - Legacy banner appears on non-settings pages.
4. **Merge into existing v3 save:** ensure inventory counts are additive and existing quests +
   processes are preserved (no overwrite).
5. **Replace into existing v3 save:** ensure v3 state matches the legacy v2 payload exactly
   (except for v3 defaults like settings/meta).
6. **Persistence check:** confirm v3 writes to IndexedDB and **does not delete** v2 localStorage
   unless the **Discard legacy v2 data** action is used. (Must verify in QA.)
7. **Failure cases:**
    - Invalid JSON in `gameState` should show a clear UX without crashing or deleting data
      (must verify banner behavior).
    - Partial `gameState` (missing quests/inventory/processes) should migrate with defaults.
    - Large inventories / many items should still migrate successfully.

## V1 storage (cookies) vs v2/v3

### V2 storage (localStorage)

**Schema:** v2.1 uses a single JSON blob in `localStorage["gameState"]`. See the
**DSPACE v2.1 save format** section above for the authoritative schema and examples.

**Keys used in v3 detection:**

- `gameState` (legacy v2 primary key).
- `gameStateBackup` (v3 backup key; may be absent in v2.1).

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
