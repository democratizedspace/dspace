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
  format. See [`/changelog#20230630`](/changelog#20230630).
- **V2.1 localStorage format (September 15, 2023):** v2.1 explicitly documents that game state is
  stored in localStorage. See [`/changelog#20230915`](/changelog#20230915).
- **V3 IndexedDB migration (February 1, 2026):** v3 ships the IndexedDB storage system and a
  migration path from localStorage. See [`/changelog#20260201`](/changelog#20260201).

## DSPACE v1 save format (commit `fc840def24c5140411d2892f468960acb8250681`)

### High-level summary

- **Storage split:** v1 uses **cookies** for inventory, currency, and quest progress, and uses
  **localStorage** for process timers + machine locks.
- **Legacy detection in v3:** the v3 upgrader looks at cookies + localStorage to detect legacy v1
  saves before a v2/v3 merge.
- **Migration scope (recommended default):** migrate **inventory + currency balances only**. Quest
  completion + checkpoints and process timers are intentionally out of scope because v1 quest IDs
  are numeric (`/quests/play/<int>`) while v2/v3 use slug-based routes, making ID mapping ambiguous.

### Cookie schema (authoritative)

v1 writes cookies via `setCookieValue` (persistent expiry, `path=/`) and uses `parseFloat` to
consume item and balance values. Quest progress cookies are only written when
`acceptedCookies=true` is present (quests use `hasAcceptedCookies` to gate writes).

| Key pattern | Example key | Value format | Meaning | Written when | Notes |
| --- | --- | --- | --- | --- | --- |
| `acceptedCookies` | `acceptedCookies` | `true` | Consent flag for v1 cookie saves. | Set after the `/accept_cookies` flow routes to `/accepted_cookies`. | Used by `hasAcceptedCookies`; quests/checkpoints only persist when accepted. |
| `quest-<questId>-finished` | `quest-7-finished` | JS `Date` string | Marks quest completion. | On `/quests/finish/<questId>` if cookies were accepted. | Quest IDs are numeric in v1. |
| `checkpoint-<questId>` | `checkpoint-5` | Integer step ID | Tracks a checkpointed quest step. | On `/quests/play/<questId>/<stepId>` when the step is flagged as `checkpoint`. | Only written when cookies were accepted. |
| `item-<itemId>` | `item-3` | Float or integer (string) | Non-currency inventory counts. | Item earn/burn, shop buy/sell, quest rewards/burns. | Currency items (like dUSD) are not stored here. |
| `currency-balance-<symbol>` | `currency-balance-dUSD` | Float (string) | Currency wallet balance by symbol. | Wallet updates, shop buy/sell, burns. | dUSD is the only v1 item with `type: "currency"` and uses `symbol: "dUSD"`. |

**Verified v1 implementation references:**

- Accept/deny cookies flow and `acceptedCookies` write:
  `frontend/src/pages/accept_cookies.astro`,
  `frontend/src/pages/accepted_cookies.astro`
- Cookie helpers + `hasAcceptedCookies` gating:
  `frontend/src/utils.js`
- Item + currency cookie writes, including buy/sell/burns:
  `frontend/src/pages/inventory/utils.js`
- Quest completion cookie:
  `frontend/src/pages/quests/finish/[questId].astro`
- Quest checkpoint cookie:
  `frontend/src/pages/quests/play/[questId]/[stepId].astro`

### localStorage schema (authoritative)

| Key pattern | Example key | Value format | Meaning | Written when | Notes |
| --- | --- | --- | --- | --- | --- |
| `process-<processId>-starttime` | `process-outlet-dWatt-starttime` | Epoch timestamp (ms) | Start timestamp for a running process. | On process start; removed on finalize. | Stored via `Date().getTime()` and used to resume progress. |
| `machine-lock-<machineId>` | `machine-lock-29` | Integer | Active lock count for a machine. | Increment on process start; decrement/remove on finalize. | Used by the machines page to show availability. |

**Verified v1 implementation references:**

- Process timers + machine locks:
  `frontend/src/pages/processes/process.svelte`
- Machines availability reads:
  `frontend/src/pages/machines/index.astro`

### How to inspect a v1 save (DevTools)

1. Open **DevTools → Application** (Chrome) or **Storage** (Firefox).
2. **Cookies:** select your domain, then filter for `acceptedCookies`, `item-`, `currency-balance-`,
   `quest-`, and `checkpoint-`.
3. **LocalStorage:** select your domain and look for `process-*-starttime` and `machine-lock-*`.
4. Example cookie header fragment (copy/pasteable):

    ```
    acceptedCookies=true; item-3=50; item-20=2; item-46=3;
    currency-balance-dUSD=123.45; quest-0-finished=Sat Jan 01 2022 00:00:00 GMT+0000
    ```

> **Note:** Quest/progress cookies can exist for detection/QA, but the default migration scope is
> inventory + currency only.

### v1 seed profiles for `/settings` (for seeding UI + QA)

Use these explicit key/value sets as the baseline for the “Seed sample v1 save (cookies)” panel.
They are derived from the v1 save format above and intentionally focus on **inventory + currency**.
Quest/progress keys are optional and should remain **non-migrated** by default.

#### Minimal seed (cookies only)

**Set these cookies:**

```
acceptedCookies=true
item-3=12.5
item-10=2
item-20=1
currency-balance-dUSD=123.45
quest-0-finished=Sat Jan 01 2022 00:00:00 GMT+0000
```

**Expected v3 detection outcome:**

- Global “Legacy save detected” banner appears after reload.
- `/settings` → **Legacy save upgrades** shows a v1 card listing:
  - Items: `item-3`, `item-10`, `item-20` (dCarbon is an **item**, not a currency).
  - Currency balances: `currency-balance-dUSD`.
- Quest/progress cookie is shown as **detected but not migrated** (or ignored, if UI does not
  surface it).

#### Maximal seed (cookies + localStorage)

**Set these cookies (all from minimal):**

```
acceptedCookies=true
item-3=12.5
item-10=2
item-20=1
currency-balance-dUSD=123.45
quest-0-finished=Sat Jan 01 2022 00:00:00 GMT+0000
```

**Set these localStorage keys:**

```
process-outlet-dWatt-starttime=1700000000000
machine-lock-29=1
```

**Expected v3 detection outcome:**

- Global legacy banner appears (same as minimal).
- v1 upgrade panel still lists cookie-based inventory + balances.
- LocalStorage values are **detected for QA visibility** but should **not** be migrated by default.

### QA: v1 → v2 → v3 migration checklist

1. **Start clean:** clear IndexedDB (`dspaceGameState`) and localStorage, reload, confirm no legacy
   banner.
2. **Seed v1 cookies (minimal):** apply the minimal seed profile cookies and reload.
3. **Confirm detection UX:**
   - Legacy banner appears on non-settings pages and links back to `/settings`.
   - `/settings` → v1 upgrade panel lists detected items + dUSD balance.
4. **Merge v1 into v3:**
   - Use **Merge v1 into current save**.
   - Verify inventory gains the seeded items and wallet gains `dUSD` balance.
   - Re-run merge to confirm idempotency (no double-adding on repeated merges).
5. **Seed v1 maximal:** apply maximal profile (cookies + localStorage), reload, confirm detection.
6. **Repeat merge verification:** same expectations as minimal; process timers/locks are ignored.
7. **Handoff to v2 → v3:** note that v2 auditing is documented separately; v1 verification should
   only confirm that v1 artifacts do not block v2 detection and that v1 data is merged correctly.

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

After seeding, use [`/settings`](/settings) → **Legacy save upgrades** to merge or replace, and verify detection
with the global legacy banner (shared detection logic).

## Appendix: v1 item catalog (for mapping)

Source of truth: `frontend/src/pages/inventory/json/items.json` from commit
`fc840def24c5140411d2892f468960acb8250681`.

| itemId | name | description | type | price | symbol | unit |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | Real Printer 1 | A basic cheap printer that is easy to use and has a large community of users. | machine | 200 | dUSD | — |
| 1 | Benchy | A basic test print that is used to test the quality of a printer. | 3dprint | 5 | dUSD | — |
| 2 | hydroponics kit | A hydroponics tub with all the basic features you need to grow your own plants. | — | 30 | dUSD | — |
| 3 | white PLA filament | 1 gram of white PLA filament for an FDM printer. | — | 0.02499 | dUSD | g |
| 4 | Edison Model M | A futuristic electric vehicle with Fully Supervised Driving (FSD) capabilities. | — | 40000 | dUSD | — |
| 5 | portable solar panel | A portable solar panel that can be used to charge your devices. Supports USB-A and USB-C ports, and it has a 110V AC outlet, with support for 200W at peak sunpower. | machine | 200 | dUSD | — |
| 6 | 200 Wh battery pack | A 200 Wh battery pack that can be used to store energy from a solar panel or a wind turbine. | — | 130 | dUSD | — |
| 7 | 500W wind turbine | A 500W wind turbine that can be used to generate electricity. | — | 200 | dUSD | — |
| 8 | Benchy Award | A trophy granted for printing your first Benchy. | — | — | — | — |
| 9 | Real Hydroponics Tub 1 | A hydroponics tub with all the basic features you need to grow your own plants. | machine | 30 | dUSD | — |
| 10 | basil seeds | A packet of basil seeds. | — | 5 | dUSD | — |
| 11 | 3D printed model rocket | A 3D-printed model rocket that can be used to launch small payloads into space. | 3dprint | 25 | dUSD | — |
| 12 | green PLA filament | 1 gram of green PLA filament for an FDM printer. | — | 0.02499 | dUSD | g |
| 13 | hydroponic starter plug | 1 rockwool starter plug for hydroponic seed germination. | — | 0.35 | dUSD | — |
| 14 | hydroponics nutrients | A bottle of hydroponics nutrients that can be used to grow plants. NPK: 9-3-6 | — | 25 | dUSD |  L |
| 15 | 3D printing kit | A kit that contains all the parts you need to get started with 3D printing. Everything is fully assembled. | — | — | — | — |
| 16 | 5 gallon bucket | A 5 gallon bucket that can be used to store water or other liquids. | — | 8 | dUSD | — |
| 17 | 5 gallon bucket of tap water (chlorinated) | A 5 gallon bucket of water. This water is chlorinated and should not be used for hydroponics. | machine | — | — | — |
| 18 | Motor Award | A trophy granted for being one of the first people to buy an Edison Model M | — | — | — | — |
| 19 | Rocket Award | A trophy granted for printing your first model rocket. | — | — | — | — |
| 20 | dCarbon | A token that is generated for every 1 kg of carbon dioxide generated in-game. | — | — | — | — |
| 21 | Hypercar (80% charge) | A futuristic electric vehicle with Fully Supervised Driving (FSD) capabilities. 80% charged. | — | — | — | — |
| 22 | dWatt | A token that represents 1 watt of electricity that can be consumed by machines. To acquire 1 dWatt, you need to either prepay the dCarbon cost, or generate and store it in a battery without accruing dCarbon. | — | — | — | — |
| 23 | Hypervan | A futuristic electric van with Fully Supervised Driving (FSD) capabilities. | — | 75000 | dUSD | — |
| 24 | dUSD | An in-game tokenized version of the USD currency. Not backed by or in any way associated with actual USD. | currency | — | dUSD | — |
| 25 | 5 gallon bucket of tap water (dechlorinated) | A 5 gallon bucket of water. This water is dechlorinated and can be used for hydroponics. | machine | — | — | — |
| 26 | soaked hydroponic starter plug | A hydroponic starter plug soaked in water. Used to germinate seeds. | machine | — | — | — |
| 27 | basil seedling | A basil seedling that has been germinated in a rockwool cube. | — | — | — | — |
| 28 | sink | Generates tap water. | machine | — | — | — |
| 29 | smart plug | A smart plug that plugs into a wall outlet to measure energy usage. | machine | — | — | — |
| 30 | 3D printed nosecone | A nosecone for a modular model rocket. | — | — | — | — |
| 31 | 3D printed body tube | A body tube for a modular model rocket. | — | — | — | — |
| 32 | 3D printed fincan | A fincan for a modular model rocket. | — | — | — | — |
| 33 | 3D printed nosecone coupler | A nosecone coupler for a modular model rocket. | — | — | — | — |
| 34 | hobbyist solid rocket motor | 24mm in diameter, 95mm long, weighing 58.1g. Max thrust: 31.3 Newtons. | — | 10 | dUSD | — |
| 35 | superglue | Don't get it on your hands! | machine | 10 | dUSD | — |
| 36 | kevlar cord | Perfect for model rocketry. | — | 0.3 | dUSD |  m |
| 37 | rocket igniter | Ignite a rocket motor with electricity. | — | 0.1 | dUSD | — |
| 38 | launch controller | A controller for launching model rockets. | machine | 20 | dUSD | — |
| 39 | launch-capable model rocket | A model rocket ready for launch. Ignite remotely using the launch controller. | — | — | — | — |
| 40 | damaged model rocket | Badly damaged and broken in several places. | — | — | — | — |
| 41 | Rocketeer Award | Awarded for launching your first rocket! | — | — | — | — |
| 42 | harvestable basil plant | A basil plant that is ready to be harvested. Growing medium: rockwool. | machine | — | — | — |
| 43 | hydroponic grow lamp | Nice pink lighting that completely changes the vibe of your room. Also used for growing plants. Energy consumption: 36W. | — | 50 | dUSD | — |
| 44 | Real Hydroponics Tub 1 (ready) | A hydroponic tub that is ready to be used. Contains a nutrient solution suitable for most leafy greens. | machine | — | — | — |
| 45 | Real Hydroponics Tub 1 (nutrient deficient) | A hydroponic tub that is ready to be used. Contains a nutrient solution suitable for most leafy greens. | machine | — | — | — |
| 46 | bundle of basil leaves | A bundle of basil leaves. Maybe we can make pesto in the future? For now, maybe just sell it. | — | 3 | dUSD | — |
| 47 | harvested basil plant | A basil plant that has been freshly harvested. Don't worry, it'll grow back eventually! | — | — | — | — |
| 48 | Green Thumb Award | Awarded for growing and harvesting your first batch of hydroponic basil! | — | — | — | — |
| 49 | Solarpunk Award | Awarded for generating dWatt using solar panels! | — | — | — | — |
| 50 | Completionist Award | Awarded for completing all of the quests avaialble on January 1, 2023. | — | — | — | — |
| 51 | aquarium (150 L) | A glass tank for housing fish. | machine | 60 | dUSD | — |
| 52 | aquarium (goldfish) (150 L) | An aquarium containing a goldfish. | machine | — | — | — |
| 53 | goldfish | A goldfish. | — | 10 | dUSD | — |
| 54 | goldfish food | Food suitable for a goldfish. | — | 10 | dUSD | — |
| 55 | aquarium filter | A filter for a fish tank. | — | 30 | dUSD | — |
| 56 | aquarium heater | A heater for a fish tank. | — | 20 | dUSD | — |
| 57 | aquarium light | A light for a fish tank. | — | 15 | dUSD | — |
| 58 | Thermometer | A thermometer for measuring temperature. | — | 15 | dUSD | — |
| 59 | pH strip | A pH strip for measuring pH. | — | 0.15 | dUSD | — |
| 60 | 7 pH freshwater aquarium (150 L) | An freshwater aquarium with a pH of 7. | machine | — | — | — |
| 61 | dSolar | a token that represents 1 Watt of energy generated using a solar panel. | — | — | — | — |
| 62 | gravel | Loose gravel suitable for use in an aquarium. | — | 1 | dUSD |  kg |
| 63 | aquarium net | A net for catching fish. | — | 5 | dUSD | — |
| 64 | dGoldfish | A token granted for feeding a goldfish | — | — | — | — |
| 65 | Fish Friend Award | An award given for setting up your first goldfish aquarium. | — | — | — | — |
| 66 | parachute | A parachute for model rockets. | — | 30 | dUSD | — |
| 67 | launch-capable model rocket (parachute) | A reusable rocket with a parachute | — | — | — | — |
| 68 | Rocket Descent (animated) | A rocket descending to the ground with a parachute. | — | — | — | — |
| 69 | dLaunch | 1 dLaunch = 1 launch of a rocket. Any launch counts, even a model rocket launch. | — | — | — | — |
| 70 | dOffset | 1 dOffset is granted for reducing dCarbon with dUSD.  | — | — | — | — |
| 71 | Tree Hugger Award | Awarded for converting dCarbon to dOffset. | — | — | — | — |
| 72 | dBI | Awarded for every dUSD earned through Basic Income. See the Wallet page for more details. | — | — | — | — |
| 73 | EV charger | A charger for electric vehicles. | — | 500 | dUSD | — |
| 74 | Hypercar (20% charge) | A futuristic electric vehicle with Fully Supervised Driving (FSD) capabilities. 20% charged. | — | 30000 | dUSD | — |
| 75 | Hypercar (animated) | A hypercar driving down the road. | — | — | — | — |
| 76 | 1 kWh battery pack | A 1kWh Wh battery pack that can be used to store energy from a solar panel or a wind turbine. | — | 1000 | dUSD | — |
| 77 | The grass is always greener (still) | A still image of a Hypercar on a grassy field. | — | — | — | — |
