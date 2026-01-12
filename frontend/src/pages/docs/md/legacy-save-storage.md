---
title: 'Legacy saves & storage migrations'
slug: 'legacy-save-storage'
---

# Legacy saves & storage migrations

This doc explains how DSPACE stores game state across v1 (cookies + localStorage), v2
(localStorage), and v3 (IndexedDB), plus how the legacy upgrade flow detects and migrates older
state into the v3 save format.

## Release timeline context

- **V1 → V2 transition (June 30, 2023):** The v2 release notes call out returning v1 players and
  the quest reset, which anchors the cutoff between cookie-era saves and the v2 localStorage
  format. See [`/changelog#20230630`](/changelog#20230630).
- **V2.1 localStorage format (September 15, 2023):** v2.1 explicitly documents that game state is
  stored in localStorage. See [`/changelog#20230915`](/changelog#20230915).
- **V3 IndexedDB migration (February 1, 2026):** v3 ships the IndexedDB storage system and a
  migration path from localStorage. See [`/changelog#20260201`](/changelog#20260201).

## DSPACE v1 save format (cookies + localStorage)

**Stable reference:** The last commit on the `main` branch before DSPACE v2 is
[`fc840def24c5140411d2892f468960acb8250681`](https://github.com/democratizedspace/dspace/tree/fc840def24c5140411d2892f468960acb8250681).
Use this commit to verify v1 storage behavior and to craft seed data for migration QA.

### High-level summary

- **Cookies store inventory + quest progress.** Item counts are stored per item cookie; quest
  completion and checkpoint progress are stored in quest-specific cookies.
- **localStorage stores process timing + machine locks.** Process start times and per-machine lock
  counters are stored in localStorage.
- **Cookie acceptance gates quest progress cookies.** `acceptedCookies=true` is written by
  `/accept_cookies` and is required before quest completion or checkpoint cookies are written.
- **V3 migration scope (recommended):** migrate **inventory + currency balances only**. Quest
  completion, checkpoints, and process timers are skipped by default because v1 IDs are numeric
  strings and v2/v3 use slug-based identifiers, making ID mapping unreliable across versions.

### Cookie schema (authoritative)

| Key pattern | Example key | Value format | Meaning | Written when | Notes |
| --- | --- | --- | --- | --- | --- |
| `acceptedCookies` | `acceptedCookies` | `true` | User has accepted cookies. | `/accept_cookies` endpoint sets the cookie on visit, with a long-lived expiry. | This gate is checked before quest completion/checkpoint cookies are written. |
| `quest-<questId>-finished` | `quest-0-finished` | Date string (from `new Date(Date.now())`) | Marks a quest as completed. | Quest finish page sets the cookie after awarding rewards. | Only set when `acceptedCookies=true` (quest finish checks `hasAcceptedCookies`). |
| `checkpoint-<questId>` | `checkpoint-3` | Integer step ID as a string | Marks the current checkpoint step within a quest. | Quest step page sets the cookie when the step has `checkpoint: true`. | Only set when `acceptedCookies=true`. |
| `item-<itemId>` | `item-3` | Numeric string (parsed with `parseFloat`) | Inventory count for non-currency items. | Added/consumed via inventory helpers (buy/sell, quest rewards, burns). | V1 item IDs are numeric strings (see item catalog). |
| `currency-balance-<symbol>` | `currency-balance-dUSD` | Numeric string (parsed with `parseFloat`) | Wallet balance for currency items. | Updated during buy/sell, quest rewards, and currency burns. | V1 currency items are defined by `type: "currency"` in the item catalog. |

**Key v1 code references (cookies):**

- Cookie acceptance redirect + write: `frontend/src/pages/accepted_cookies.astro`.
- Cookie parsing + helpers: `frontend/src/utils.js` (`setCookieValue`, `getWalletBalance`,
  `addWalletBalance`, `burnCurrency`, `isQuestCompleted`, `hasAcceptedCookies`).
- Inventory item writes: `frontend/src/pages/inventory/utils.js` (`addItemToInventory`, `buyItem`,
  `sellItem`, `burnItem`).
- Quest completion: `frontend/src/pages/quests/finish/[questId].astro`.
- Quest checkpoint writes: `frontend/src/pages/quests/play/[questId]/[stepId].astro`.

### localStorage schema (authoritative)

| Key pattern | Example key | Value format | Meaning | Written when | Notes |
| --- | --- | --- | --- | --- | --- |
| `process-<processId>-starttime` | `process-outlet-dWatt-starttime` | Epoch milliseconds (number) | Saved start time for a running process. | Process start writes the start time; process completion removes it. | Used to resume the progress bar after reload. |
| `machine-lock-<machineId>` | `machine-lock-29` | Integer counter | Count of active locks on a machine. | Process start increments the lock; completion decrements/removes. | Machines page subtracts the lock value from owned machine count. |

**Key v1 code references (localStorage):**

- Process timing + locks: `frontend/src/pages/processes/process.svelte`.
- Machines availability reads: `frontend/src/pages/machines/index.astro`.

### How to inspect a v1 save (DevTools)

1. Open the site and launch DevTools → **Application** tab.
2. **Cookies:** select the site origin and look for `acceptedCookies`, `item-*`,
   `currency-balance-*`, `quest-*`, and `checkpoint-*`.
3. **localStorage:** select the same origin and inspect `process-*-starttime` and
   `machine-lock-*` keys.

Example cookie header fragment (copy/pasteable):

```
acceptedCookies=true; item-3=250.5; item-10=4; item-20=12; currency-balance-dUSD=1234.56; quest-0-finished=Thu%20Feb%2001%202024%2012:00:00%20GMT%2B0000%20(UTC)
```

## V1 seed profiles for `/settings`

Use these profiles to implement the **Seed sample v1 save (cookies)** action and to QA legacy
migration behavior. These profiles intentionally focus on **items + currency** (the default
migration scope). Quest and checkpoint keys are included only for detection testing.

> **Reminder:** v1 quest IDs are numeric strings (e.g., `"0"`) while v2/v3 quests use slug IDs.
> Migration should skip v1 quest cookies by default.

### Minimal seed (cookies only)

**Cookies to set:**

```
acceptedCookies=true
item-3=250.5
item-10=4
item-20=12
item-70=1
currency-balance-dUSD=1234.56
quest-0-finished=Thu Feb 01 2024 12:00:00 GMT+0000 (UTC)
checkpoint-0=0
```

**Expected v3 detection outcome:**

- Global **Legacy save detected** banner appears on non-settings pages.
- `/settings` → **Legacy save upgrades** shows a v1 card with detected cookies.
- Detected inventory includes item IDs `3`, `10`, `20`, `70` with their counts.
- Detected wallet includes `dUSD: 1234.56`.
- Quest/checkpoint cookies are surfaced (if UI supports it) or explicitly ignored by migration.

### Maximal seed (cookies + localStorage)

**Cookies to set (everything in minimal):**

```
acceptedCookies=true
item-3=250.5
item-10=4
item-20=12
item-70=1
currency-balance-dUSD=1234.56
quest-0-finished=Thu Feb 01 2024 12:00:00 GMT+0000 (UTC)
checkpoint-0=0
```

**localStorage to set:**

```
process-outlet-dWatt-starttime=1706788800000
machine-lock-29=1
```

**Expected v3 detection outcome:**

- Same behavior as the minimal seed for cookies (banner + v1 card).
- LocalStorage keys do **not** migrate into v3 inventory by default.
- If the UI shows localStorage artifacts, they should be marked as legacy v1 process data or
  ignored by migration.

## QA: v1 → v2 → v3 migration checklist

Use this checklist to manually verify v1 migration behavior before chaining into the v2 upgrade
path.

1. **Start clean:** Reset v3 storage (IndexedDB + localStorage). Confirm **no** legacy banner.
2. **Seed minimal v1 cookies:** Apply the minimal seed profile. Refresh the page.
3. **Banner verification:** Confirm the global “Legacy save detected” banner appears and links to
   `/settings`.
4. **Settings detection:** In `/settings` → **Legacy save upgrades**, confirm:
   - Detected v1 items list matches `item-*` cookies.
   - Detected wallet balances match `currency-balance-*` cookies.
   - Quest/checkpoint cookies are shown as **not migrated** (or explicitly ignored).
5. **Merge v1 into current save:** Run **Merge** and verify:
   - Inventory gains the seeded item counts.
   - Wallet gains the seeded `dUSD` balance.
   - Re-running **Merge** adds the same counts again (merge is additive), so repeated merges should
     be avoided during QA unless testing additive behavior.
6. **Replace v1 into current save:** Run **Replace** and verify:
   - Inventory becomes exactly the seeded counts (no additive duplication).
   - Wallet balances match seeded values.
7. **Seed maximal profile:** Clear legacy data and apply the maximal profile. Confirm detection as
   above; localStorage keys should not affect inventory/currency migrations.
8. **Handoff to v2→v3:** Once v1 behavior is verified, continue with the v2 audit (documented
   separately) for the v1→v2→v3 migration narrative.

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

## V3 storage (IndexedDB)

**Schema:** The canonical v3 save lives in IndexedDB, with localStorage used as a lightweight backup
and fallback for unsupported environments.

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

- V1 cleanup expires each `item-<id>` cookie (see
  [`frontend/src/components/svelte/LegacySaveUpgrade.svelte`](https://github.com/democratizedspace/dspace/blob/v3/frontend/src/components/svelte/LegacySaveUpgrade.svelte)).
- V2 cleanup deletes `gameState` / `gameStateBackup` (also in the Legacy Save Upgrade UI).

## QA seeding (v2 + v3 fixtures)

QA seeding writes known-good fixtures that match the v2/v3 schemas above.

- **V2 seed:**
  [`frontend/src/utils/legacySaveSeeding.ts`](https://github.com/democratizedspace/dspace/blob/v3/frontend/src/utils/legacySaveSeeding.ts)
  reads
  [`frontend/src/utils/legacySaveFixtures/legacy_v2_localstorage_save.json`](https://github.com/democratizedspace/dspace/blob/v3/frontend/src/utils/legacySaveFixtures/legacy_v2_localstorage_save.json).

After seeding, use [`/settings`](/settings) → **Legacy save upgrades** to merge or replace, and
verify detection with the global legacy banner (shared detection logic).

## Appendix: v1 item catalog (for mapping)

Source of truth: `frontend/src/pages/inventory/json/items.json` in commit
`fc840def24c5140411d2892f468960acb8250681`.

| Item ID | Name | Description | Type | Price | Symbol | Unit |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | Real Printer 1 | A basic cheap printer that is easy to use and has a large community of users. | machine | 200 dUSD |  |  |
| 1 | Benchy | A basic test print that is used to test the quality of a printer. | 3dprint | 5 dUSD |  |  |
| 2 | hydroponics kit | A hydroponics tub with all the basic features you need to grow your own plants. |  | 30 dUSD |  |  |
| 3 | white PLA filament | 1 gram of white PLA filament for an FDM printer. |  | 0.02499 dUSD |  | g |
| 4 | Edison Model M | A futuristic electric vehicle with Fully Supervised Driving (FSD) capabilities. |  | 40000 dUSD |  |  |
| 5 | portable solar panel | A portable solar panel that can be used to charge your devices. Supports USB-A and USB-C ports, and it has a 110V AC outlet, with support for 200W at peak sunpower. | machine | 200 dUSD |  |  |
| 6 | 200 Wh battery pack | A 200 Wh battery pack that can be used to store energy from a solar panel or a wind turbine. |  | 130 dUSD |  |  |
| 7 | 500W wind turbine | A 500W wind turbine that can be used to generate electricity. |  | 200 dUSD |  |  |
| 8 | Benchy Award | A trophy granted for printing your first Benchy. |  |  |  |  |
| 9 | Real Hydroponics Tub 1 | A hydroponics tub with all the basic features you need to grow your own plants. | machine | 30 dUSD |  |  |
| 10 | basil seeds | A packet of basil seeds. |  | 5 dUSD |  |  |
| 11 | 3D printed model rocket | A 3D-printed model rocket that can be used to launch small payloads into space. | 3dprint | 25 dUSD |  |  |
| 12 | green PLA filament | 1 gram of green PLA filament for an FDM printer. |  | 0.02499 dUSD |  | g |
| 13 | hydroponic starter plug | 1 rockwool starter plug for hydroponic seed germination. |  | 0.35 dUSD |  |  |
| 14 | hydroponics nutrients | A bottle of hydroponics nutrients that can be used to grow plants. NPK: 9-3-6 |  | 25 dUSD |  |  L |
| 15 | 3D printing kit | A kit that contains all the parts you need to get started with 3D printing. Everything is fully assembled. |  |  |  |  |
| 16 | 5 gallon bucket | A 5 gallon bucket that can be used to store water or other liquids. |  | 8 dUSD |  |  |
| 17 | 5 gallon bucket of tap water (chlorinated) | A 5 gallon bucket of water. This water is chlorinated and should not be used for hydroponics. | machine |  |  |  |
| 18 | Motor Award | A trophy granted for being one of the first people to buy an Edison Model M |  |  |  |  |
| 19 | Rocket Award | A trophy granted for printing your first model rocket. |  |  |  |  |
| 20 | dCarbon | A token that is generated for every 1 kg of carbon dioxide generated in-game. |  |  |  |  |
| 21 | Hypercar (80% charge) | A futuristic electric vehicle with Fully Supervised Driving (FSD) capabilities. 80% charged. |  |  |  |  |
| 22 | dWatt | A token that represents 1 watt of electricity that can be consumed by machines. To acquire 1 dWatt, you need to either prepay the dCarbon cost, or generate and store it in a battery without accruing dCarbon. |  |  |  |  |
| 23 | Hypervan | A futuristic electric van with Fully Supervised Driving (FSD) capabilities. |  | 75000 dUSD |  |  |
| 24 | dUSD | An in-game tokenized version of the USD currency. Not backed by or in any way associated with actual USD. | currency |  | dUSD |  |
| 25 | 5 gallon bucket of tap water (dechlorinated) | A 5 gallon bucket of water. This water is dechlorinated and can be used for hydroponics. | machine |  |  |  |
| 26 | soaked hydroponic starter plug | A hydroponic starter plug soaked in water. Used to germinate seeds. | machine |  |  |  |
| 27 | basil seedling | A basil seedling that has been germinated in a rockwool cube. |  |  |  |  |
| 28 | sink | Generates tap water. | machine |  |  |  |
| 29 | smart plug | A smart plug that plugs into a wall outlet to measure energy usage. | machine |  |  |  |
| 30 | 3D printed nosecone | A nosecone for a modular model rocket. |  |  |  |  |
| 31 | 3D printed body tube | A body tube for a modular model rocket. |  |  |  |  |
| 32 | 3D printed fincan | A fincan for a modular model rocket. |  |  |  |  |
| 33 | 3D printed nosecone coupler | A nosecone coupler for a modular model rocket. |  |  |  |  |
| 34 | hobbyist solid rocket motor | 24mm in diameter, 95mm long, weighing 58.1g. Max thrust: 31.3 Newtons. |  | 10 dUSD |  |  |
| 35 | superglue | Don't get it on your hands! | machine | 10 dUSD |  |  |
| 36 | kevlar cord | Perfect for model rocketry. |  | 0.3 dUSD |  |  m |
| 37 | rocket igniter | Ignite a rocket motor with electricity. |  | 0.1 dUSD |  |  |
| 38 | launch controller | A controller for launching model rockets. | machine | 20 dUSD |  |  |
| 39 | launch-capable model rocket | A model rocket ready for launch. Ignite remotely using the launch controller. |  |  |  |  |
| 40 | damaged model rocket | Badly damaged and broken in several places. |  |  |  |  |
| 41 | Rocketeer Award | Awarded for launching your first rocket! |  |  |  |  |
| 42 | harvestable basil plant | A basil plant that is ready to be harvested. Growing medium: rockwool. | machine |  |  |  |
| 43 | hydroponic grow lamp | Nice pink lighting that completely changes the vibe of your room. Also used for growing plants. Energy consumption: 36W. |  | 50 dUSD |  |  |
| 44 | Real Hydroponics Tub 1 (ready) | A hydroponic tub that is ready to be used. Contains a nutrient solution suitable for most leafy greens. | machine |  |  |  |
| 45 | Real Hydroponics Tub 1 (nutrient deficient) | A hydroponic tub that is ready to be used. Contains a nutrient solution suitable for most leafy greens. | machine |  |  |  |
| 46 | bundle of basil leaves | A bundle of basil leaves. Maybe we can make pesto in the future? For now, maybe just sell it. |  | 3 dUSD |  |  |
| 47 | harvested basil plant | A basil plant that has been freshly harvested. Don't worry, it'll grow back eventually! |  |  |  |  |
| 48 | Green Thumb Award | Awarded for growing and harvesting your first batch of hydroponic basil! |  |  |  |  |
| 49 | Solarpunk Award | Awarded for generating dWatt using solar panels! |  |  |  |  |
| 50 | Completionist Award | Awarded for completing all of the quests avaialble on January 1, 2023. |  |  |  |  |
| 51 | aquarium (150 L) | A glass tank for housing fish. | machine | 60 dUSD |  |  |
| 52 | aquarium (goldfish) (150 L) | An aquarium containing a goldfish. | machine |  |  |  |
| 53 | goldfish | A goldfish. |  | 10 dUSD |  |  |
| 54 | goldfish food | Food suitable for a goldfish. |  | 10 dUSD |  |  |
| 55 | aquarium filter | A filter for a fish tank. |  | 30 dUSD |  |  |
| 56 | aquarium heater | A heater for a fish tank. |  | 20 dUSD |  |  |
| 57 | aquarium light | A light for a fish tank. |  | 15 dUSD |  |  |
| 58 | Thermometer | A thermometer for measuring temperature. |  | 15 dUSD |  |  |
| 59 | pH strip | A pH strip for measuring pH. |  | 0.15 dUSD |  |  |
| 60 | 7 pH freshwater aquarium (150 L) | An freshwater aquarium with a pH of 7. | machine |  |  |  |
| 61 | dSolar | a token that represents 1 Watt of energy generated using a solar panel. |  |  |  |  |
| 62 | gravel | Loose gravel suitable for use in an aquarium. |  | 1 dUSD |  |  kg |
| 63 | aquarium net | A net for catching fish. |  | 5 dUSD |  |  |
| 64 | dGoldfish | A token granted for feeding a goldfish |  |  |  |  |
| 65 | Fish Friend Award | An award given for setting up your first goldfish aquarium. |  |  |  |  |
| 66 | parachute | A parachute for model rockets. |  | 30 dUSD |  |  |
| 67 | launch-capable model rocket (parachute) | A reusable rocket with a parachute |  |  |  |  |
| 68 | Rocket Descent (animated) | A rocket descending to the ground with a parachute. |  |  |  |  |
| 69 | dLaunch | 1 dLaunch = 1 launch of a rocket. Any launch counts, even a model rocket launch. |  |  |  |  |
| 70 | dOffset | 1 dOffset is granted for reducing dCarbon with dUSD.  |  |  |  |  |
| 71 | Tree Hugger Award | Awarded for converting dCarbon to dOffset. |  |  |  |  |
| 72 | dBI | Awarded for every dUSD earned through Basic Income. See the Wallet page for more details. |  |  |  |  |
| 73 | EV charger | A charger for electric vehicles. |  | 500 dUSD |  |  |
| 74 | Hypercar (20% charge) | A futuristic electric vehicle with Fully Supervised Driving (FSD) capabilities. 20% charged. |  | 30000 dUSD |  |  |
| 75 | Hypercar (animated) | A hypercar driving down the road. |  |  |  |  |
| 76 | 1 kWh battery pack | A 1kWh Wh battery pack that can be used to store energy from a solar panel or a wind turbine. |  | 1000 dUSD |  |  |
| 77 | The grass is always greener (still) | A still image of a Hypercar on a grassy field. |  |  |  |  |
