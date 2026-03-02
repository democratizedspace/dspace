---
title: 'Legacy saves & storage migrations'
slug: 'legacy-save-storage'
---

# Legacy saves & storage migrations

This doc explains how DSPACE stores game state across v1 (cookies + localStorage), v2
(localStorage), and v3 (IndexedDB), plus how the legacy upgrade flow detects and migrates older
formats.

## Release timeline context (historical references)

- **V1 → V2 transition (June 30, 2023):** The v2 release notes call out returning v1 players and
  the quest reset, which anchors the cutoff between cookie-era saves and the v2 localStorage
  format. See [`/changelog#20230630`](/changelog#20230630).
- **V2.1 localStorage format (September 15, 2023):** v2.1 explicitly documents that game state is
  stored in localStorage. See [`/changelog#20230915`](/changelog#20230915).
- **V3 IndexedDB migration (April 1, 2026):** the changelog entry documents the IndexedDB-based
  storage system and legacy migration context. See [`/changelog#20260301`](/changelog#20260301).

## DSPACE v1 save format (commit `fc840def24c5140411d2892f468960acb8250681`)

**High-level summary**

- **Storage split:** v1 writes inventory + quest progress into cookies and uses localStorage for
  process timers and machine locks.
- **v3 detection:** v3 checks cookies/localStorage for legacy artifacts; the migration scope for v1
  is **items + currency balances** (v1 `item-<id>` cookies plus `currency-balance-dUSD`).
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

Use these profiles to seed sample v1 data (manual DevTools or the `/settings` seeder UI). The
seeded profiles are powered by
`frontend/src/utils/legacySaveFixtures/legacy_v1_cookie_save.json` and are exposed through the QA
cheats panel when it is available. QA cheats are gated by `getCheatsAvailabilityFlag`
(`frontend/src/utils/cheatsAvailability.ts`) and the toggle in
`frontend/src/components/svelte/QaCheatsToggle.svelte`, which is enabled when `DSPACE_ENV` is set
to `dev`, `development`, or `staging`.

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

**Expected v3 detection outcomes (current UI):**

- **Legacy save banner:** pages that include `<LegacyUpgradeBanner>` (via
  `frontend/src/components/Page.astro`) show the banner when `detectLegacyArtifacts` reports v1
  `item-` or `currency-balance-` cookies. The banner links to `/settings`.
- **/settings → Legacy save upgrades** shows a V1 card with the items listed above.
- **Currency balance:** `currency-balance-dUSD` is surfaced in the V1 UI and migrates into the v3
  inventory using the v1→v3 item ID mapping.

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
```

**LocalStorage to set:**

```
process-3dprint-benchy-starttime=1700000000000
machine-lock-0=1
```

**Expected v3 detection outcomes (current UI):**

- Same as minimal seed for **banner + V1 card** (v1 detection keys are cookie-based).
- No `quest-` or `checkpoint-` cookies are seeded by default; if you add them manually they remain
  **out of scope** for migration.
- `process-` and `machine-lock-` localStorage keys are **not migrated**; they exist solely for
  timer/lock state in v1 and should not affect v3 detection.

## v1 → v3 item ID mapping (authoritative)

The v1 numeric item IDs are mapped to v3 UUID item IDs during migration. The canonical mapping
lives in `frontend/src/utils/legacyV1ItemIdMap.js` and is consumed by the v1 migration helper.
Use the table below to validate mappings during QA and when auditing legacy saves.

| v1 itemId | v1 name                                      | v3 item UUID                         | v3 name                                    | Notes                                                                  |
| --------- | -------------------------------------------- | ------------------------------------ | ------------------------------------------ | ---------------------------------------------------------------------- |
| 0         | Real Printer 1                               | 8aa6dc27-dc42-4622-ac88-cbd57f48625f | entry-level FDM 3D printer                 | Renamed to 'entry-level FDM 3D printer' in v3 catalog.                 |
| 1         | Benchy                                       | 7892ffc6-c651-445f-946b-7edc998cf389 | Benchy                                     |                                                                        |
| 2         | hydroponics kit                              | 92261497-d605-4db1-8710-953cf73d765c | hydroponics kit                            |                                                                        |
| 3         | white PLA filament                           | 58580f6f-f3be-4be0-80b9-f6f8bf0b05a6 | white PLA filament                         |                                                                        |
| 4         | Edison Model M                               | 8f54a592-09de-4340-829b-7288897eb4c7 | Edison Model M                             |                                                                        |
| 5         | portable solar panel                         | 02b32152-a7b2-458e-9643-7b754c722165 | portable solar panel                       |                                                                        |
| 6         | 200 Wh battery pack                          | cfe87611-623a-45b0-9243-422cd8a73a16 | 200 Wh battery pack                        |                                                                        |
| 7         | 500W wind turbine                            | 743681a7-d2e7-465c-af07-43665079bf4d | 500 W wind turbine                         | Renamed to '500 W wind turbine' in v3 catalog.                         |
| 8         | Benchy Award                                 | fe46e236-5d03-4c95-9b38-68b045a0df03 | Benchy Award                               |                                                                        |
| 9         | Real Hydroponics Tub 1                       | 11aa585c-fdeb-41ba-9191-be4bcdaa23c4 | Beginner hydroponics tub                   | Renamed to 'Beginner hydroponics tub' in v3 catalog.                   |
| 10        | basil seeds                                  | affa2f80-28f1-422e-a0c8-49e51ce65a1e | basil seeds                                |                                                                        |
| 11        | 3D printed model rocket                      | 5322b85e-b47d-4ea4-b515-318f91abc7df | 3D printed model rocket                    |                                                                        |
| 12        | green PLA filament                           | d3590107-25ff-4de5-af3a-46e2497bfc52 | green PLA filament                         |                                                                        |
| 13        | hydroponic starter plug                      | 78a45c1f-a791-44f1-88f4-dc5059c66c89 | hydroponic starter plug                    |                                                                        |
| 14        | hydroponics nutrients                        | ef5a843f-0a9d-41e2-b2bc-81fc9f99a150 | hydroponic nutrient concentrate (1 L)      | Renamed to 'hydroponic nutrient concentrate (1 L)' in v3 catalog.      |
| 15        | 3D printing kit                              | 9605048d-ea62-4b70-9bbc-ea1ad4baaf3e | 3D printing kit                            |                                                                        |
| 16        | 5 gallon bucket                              | 0564d441-7367-412e-b709-dad770814a39 | 5 gallon bucket                            |                                                                        |
| 17        | 5 gallon bucket of tap water (chlorinated)   | 156d06b2-ff10-4265-9ae9-3b7753c0206e | 5 gallon bucket of tap water (chlorinated) |                                                                        |
| 18        | Motor Award                                  | 2ea30b6c-bdf4-4aef-b6ce-6ce6d903d274 | Motor Award                                |                                                                        |
| 19        | Rocket Award                                 | 946b07b7-2b2c-4507-a725-edb270d8e910 | Rocket Award                               |                                                                        |
| 20        | dCarbon                                      | d88ef09c-9191-4c18-8628-a888bb9f926d | dCarbon                                    |                                                                        |
| 21        | Hypercar (80% charge)                        | 1498a7a1-2739-4943-a32f-4c277244a825 | Hypercar (80% charge)                      |                                                                        |
| 22        | dWatt                                        | 061fd221-404a-4bd1-9432-3e25b0f17a2c | dWatt                                      |                                                                        |
| 23        | Hypervan                                     | c2e3bbb6-0ded-4923-98e1-37e5ac3c7d77 | Hypervan                                   |                                                                        |
| 24        | dUSD                                         | 5247a603-294a-4a34-a884-1ae20969b2a1 | dUSD                                       |                                                                        |
| 25        | 5 gallon bucket of tap water (dechlorinated) | 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 | 5 gallon bucket of dechlorinated tap water | Renamed to '5 gallon bucket of dechlorinated tap water' in v3 catalog. |
| 26        | soaked hydroponic starter plug               | 545aeb15-7e8b-489d-be4a-af2a59f447e1 | soaked hydroponic starter plug             |                                                                        |
| 27        | basil seedling                               | 5712947f-716c-4f71-b28d-fcb811631080 | basil seedling                             |                                                                        |
| 28        | sink                                         | 799ace33-1336-46c0-904a-9f16778230f1 | sink                                       |                                                                        |
| 29        | smart plug                                   | a5395e29-1862-4eb7-8517-5d161635e032 | smart plug                                 |                                                                        |
| 30        | 3D printed nosecone                          | 7ca9cad5-4bc2-420b-9733-24d1e38c2324 | 3D printed nosecone                        |                                                                        |
| 31        | 3D printed body tube                         | 1eac8955-bb70-474b-b6b0-4002ff3aa09a | 3D printed body tube                       |                                                                        |
| 32        | 3D printed fincan                            | 563956c2-17d1-4b82-8fce-48b07dc8a71b | 3D printed fincan                          |                                                                        |
| 33        | 3D printed nosecone coupler                  | 05c339ee-f50b-419a-804a-341f850b85e9 | 3D printed nosecone coupler                |                                                                        |
| 34        | hobbyist solid rocket motor                  | 4d817f1c-d78d-4fac-a514-402bce330693 | hobbyist solid rocket motor                |                                                                        |
| 35        | superglue                                    | 7bc8b73f-6e66-469d-865f-12d0cb36677a | superglue                                  |                                                                        |
| 36        | kevlar cord                                  | 0484a3ab-92e7-42fa-a5e6-25a4afe841d6 | kevlar shock cord                          | Renamed to 'kevlar shock cord' in v3 catalog.                          |
| 37        | rocket igniter                               | d2f3e684-84e2-41f9-b39d-51ee224608ac | rocket igniter                             |                                                                        |
| 38        | launch controller                            | ae343640-c7c0-4f7e-907b-17bd87574d9b | launch controller                          |                                                                        |
| 39        | launch-capable model rocket                  | aaa5fbca-54a1-40a5-8461-24dc2ef81d4d | launch-capable model rocket                |                                                                        |
| 40        | damaged model rocket                         | 63362e5c-9897-4710-8ef6-26540fabd0ca | damaged model rocket                       |                                                                        |
| 41        | Rocketeer Award                              | c754c1e7-244c-41ec-96d4-ad468b6b3e52 | Rocketeer Award                            |                                                                        |
| 42        | harvestable basil plant                      | 79f1ea64-c58f-4f7a-8e7e-8dcca24fd1be | harvestable basil plant                    |                                                                        |
| 43        | hydroponic grow lamp                         | c8946a5f-caff-4e6d-9b9b-4dbf02bcd000 | hydroponic grow lamp                       |                                                                        |
| 44        | Real Hydroponics Tub 1 (ready)               | fc2bb989-f192-4891-8bde-78ae631dae78 | hydroponics tub (ready)                    | Renamed to 'hydroponics tub (ready)' in v3 catalog.                    |
| 45        | Real Hydroponics Tub 1 (nutrient deficient)  | dc765172-c2e4-40dd-bb5a-a399bf6d6d77 | hydroponics tub (nutrient deficient)       | Renamed to 'hydroponics tub (nutrient deficient)' in v3 catalog.       |
| 46        | bundle of basil leaves                       | 5d48cefb-fc1f-4962-b2c6-9b014151d0ae | bundle of basil leaves                     |                                                                        |
| 47        | harvested basil plant                        | 29190faf-8581-4769-b871-f0ee283840e1 | harvested basil plant                      |                                                                        |
| 48        | Green Thumb Award                            | 5599c466-91e9-46fb-8d8b-11388e4f8f9c | Green Thumb Award                          |                                                                        |
| 49        | Solarpunk Award                              | 5bba251a-d223-4e22-aa30-b65238b17516 | Solarpunk Award                            |                                                                        |
| 50        | Completionist Award                          | 1394c366-5078-49cf-b24e-c748e8428234 | Completionist Award                        |                                                                        |
| 51        | aquarium (150 L)                             | 83fe7eee-135e-4885-9ce0-9042b9fb860a | aquarium (150 L)                           |                                                                        |
| 52        | aquarium (goldfish) (150 L)                  | 76307a8e-4e0e-4dfa-abc2-7917d384d82c | aquarium (goldfish) (150 L)                |                                                                        |
| 53        | goldfish                                     | 40920981-bf9f-4b89-b887-bebe7006f7dc | goldfish                                   |                                                                        |
| 54        | goldfish food                                | 8807f2f1-3ca2-48da-9b2b-1915604a63e2 | goldfish food                              |                                                                        |
| 55        | aquarium filter                              | 6fe61da2-6aa3-447e-aad5-c65b1b8da1f1 | aquarium filter                            |                                                                        |
| 56        | aquarium heater                              | 0b85f058-38f2-4e9a-93e9-d47441608619 | aquarium heater (150 W)                    | Renamed to 'aquarium heater (150 W)' in v3 catalog.                    |
| 57        | aquarium light                               | 62757412-be94-48c0-a1c0-8fad9bdb8c4a | aquarium LED light (20 W)                  | Renamed to 'aquarium LED light (20 W)' in v3 catalog.                  |
| 58        | Thermometer                                  | 8e81b5e5-4aee-402c-bd04-fed9188f8c07 | aquarium thermometer (0–50°C)              | Renamed to 'aquarium thermometer (0–50°C)' in v3 catalog.              |
| 59        | pH strip                                     | 13167d6a-5617-4931-8a6e-6f463c6b8835 | pH strip                                   |                                                                        |
| 60        | 7 pH freshwater aquarium (150 L)             | ca7c1069-4ba3-4339-9a10-0b690a690e60 | 7 pH freshwater aquarium (150 L)           |                                                                        |
| 61        | dSolar                                       | b02ecff5-1f7d-4247-a09d-7d6cd6bb218a | dSolar                                     |                                                                        |
| 62        | gravel                                       | 75cec98f-fcf0-4d73-8d31-5a53571317b2 | aquarium gravel (1 kg)                     | Renamed to 'aquarium gravel (1 kg)' in v3 catalog.                     |
| 63        | aquarium net                                 | ee7d437d-7426-47cd-b691-386dd20f4e47 | aquarium net                               |                                                                        |
| 64        | dGoldfish                                    | 36a1168f-0109-4a8c-b70b-45f8ca582297 | dGoldfish                                  |                                                                        |
| 65        | Fish Friend Award                            | a07b75e3-f828-4cb1-81d6-1ab0e9857a79 | Fish Friend Award                          |                                                                        |
| 66        | parachute                                    | 80a83ecc-bcd2-400e-a469-8488a6453bb8 | parachute                                  |                                                                        |
| 67        | launch-capable model rocket (parachute)      | e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec | launch-capable model rocket (parachute)    |                                                                        |
| 68        | Rocket Descent (animated)                    | d660dc50-7afb-4a2f-9508-a42490aae5e4 | Rocket Descent (animated)                  |                                                                        |
| 69        | dLaunch                                      | eb9c2a75-a87a-4171-8bc3-088e75936bcf | dLaunch                                    |                                                                        |
| 70        | dOffset                                      | b0ac46e6-6c60-48f0-b753-d9b6ad9935a6 | dOffset                                    |                                                                        |
| 71        | Tree Hugger Award                            | 96e11500-a2ce-4531-a1b5-3a92c44fcb9d | Tree Hugger Award                          |                                                                        |
| 72        | dBI                                          | 016d4758-d114-4e04-9e6a-853db93a2eee | dBI                                        |                                                                        |
| 73        | EV charger                                   | 5258f098-6cae-4ee5-8888-435b08f1675a | EV charger                                 |                                                                        |
| 74        | Hypercar (20% charge)                        | 5e283c0b-fd3c-4884-ae32-9a237f02a40e | Hypercar (20% charge)                      |                                                                        |
| 75        | Hypercar (animated)                          | 3486ebb3-d262-4e90-8873-b19ed69afee8 | Hypercar (animated)                        |                                                                        |
| 76        | 1 kWh battery pack                           | 7246c1c8-f22e-4d31-acd3-967f91b8626a | 1 kWh battery pack                         |                                                                        |
| 77        | The grass is always greener (still)          | 11a2a77a-0c43-47a9-b13a-1412ac475ce2 | The grass is always greener (still)        |                                                                        |

## QA: v1 → v3 migration checklist

1. **Start clean:** clear IndexedDB + localStorage + cookies. Confirm **no legacy banner** appears.
2. **Seed minimal v1 cookies** (above), reload, and confirm the **Legacy save detected** banner
   appears on non-settings pages and links to `/settings`.
3. **Check V1 detection UI:** in `/settings` → **Legacy save upgrades**, confirm:
    - The V1 card lists item counts from `item-<id>` cookies.
    - `currency-balance-dUSD` is surfaced as a dUSD balance and marked for migration.
    - Quest/progress cookies (if present) remain ignored by default.
4. **Merge v1 into v3:** click **Merge v1 into current save**.
    - Inventory gains the seeded items.
    - dUSD balances are migrated from `currency-balance-dUSD`.
    - The UI attempts to expire detected `item-<id>` and `currency-balance-dUSD` cookies after the
      merge. If the cookies are cleared, the banner disappears after reload; if not, clear them
      manually.
    - If you re-seed the cookies and merge again, counts should increase again (merge is additive).
5. **Maximal seed case:** repeat with the maximal profile and confirm the same results, plus
   ensure process timers and machine locks remain ignored.
6. **Hand-off to v2 → v3:** after finishing v1 validation, continue with the v2 localStorage
   checklist in the section below.

## Legacy v2 localStorage payloads (current codebase)

v3 treats legacy v2 saves as localStorage JSON blobs stored under the `gameState` or
`gameStateBackup` keys (`LEGACY_V2_STORAGE_KEYS`). Parsing is handled by
`parseLegacyV2Raw`/`readLegacyV2LocalStorage` in `frontend/src/utils/legacySaveParsing.js`, which
accepts either a direct JSON object or a wrapper containing a top-level `gameState` field. A
payload is treated as legacy if `versionNumberString`/`versionNumber` starts with `1` or `2`, or if
it does not start with `3` and includes a legacy-shaped object with `inventory`, `quests`, or
`processes`.

Normalization happens in `normalizeLegacyV2State`: it keeps `quests`, `inventory`, `processes`, and
`settings` (when present) and sanitizes legacy inventory IDs through
`resolveLegacyV2ItemBase`. This is the data shape consumed by the migration helpers in
`frontend/src/utils/gameState.js`.

### v2.1 QA fixtures (seeded from `/settings`)

The QA cheats panel uses `frontend/src/utils/legacySaveFixtures/legacy_v2_localstorage_save.json`
to seed `localStorage["gameState"]` for testing. The fixture includes three profiles
(minimal, in-progress, messy) to exercise inventory remapping, quest/process preservation, and
unknown keys. These fixtures are intentionally small, representative samples — real-world saves
may include additional keys.

## QA: v2 → v3 migration checklist

1. **Start clean:** clear IndexedDB + localStorage. Confirm **no legacy banner** appears on v3.
2. **Seed each v2 profile** via the QA cheats panel (or manually set `localStorage["gameState"]`),
   then reload and confirm `/settings` → **Legacy save upgrades** reports legacy v2 data.
3. **Merge into existing v3 save:** validate additive inventory behavior and that quests/processes
   are preserved (no overwrites).
4. **Replace into existing v3 save:** validate replacement behavior and that the v3 save is written
   to IndexedDB after import.
5. **Legacy data cleanup:** `persistMigratedState` removes `gameState` and `gameStateBackup` when
   IndexedDB is in use; confirm that behavior matches runtime storage mode (localStorage-only
   environments retain legacy keys).

## V1 storage (cookies) vs v2/v3

### V2 storage (localStorage)

**Schema:** A JSON object stored under a single key in v2.1.

- **Keys:** `gameState` (v2.1). `gameStateBackup` is a v3-era fallback key but is still checked by
  v3 legacy detection. See the legacy v2 parsing section above for the authoritative schema.
- **Payload:** JSON with `versionNumberString` beginning with `2` (or a v2-shaped object containing
  `inventory`, `quests`, and `processes`), plus optional keys that are ignored during normalization
  unless they map to `settings`.
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
  `frontend/src/utils/legacySaveDetection.ts`
  (`detectLegacyArtifacts`) and
  `frontend/src/utils/legacySaveParsing.js`
  (`readLegacyV2LocalStorage`).
- Fixture seed data:
  `frontend/src/utils/legacySaveFixtures/legacy_v2_localstorage_save.json`.
- Merge/replace logic:
  `frontend/src/utils/gameState.js`
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
  `frontend/src/utils/gameState/common.js`
  (`DB_NAME`, `DB_VERSION`, `STATE_STORE`, `BACKUP_STORE`, `ROOT_KEY`).
- Persistence + fallback behavior:
  `frontend/src/utils/gameState/common.js`
  (`read`, `write`, `warnFallback`).

**DevTools inspection:**

- Application tab → IndexedDB → `dspaceGameState` → `state` / `backup` → key `root`.
- Compare with localStorage fallback keys if IndexedDB is blocked (Safari private mode, etc.).

## Detection & upgrade flow

**Detection logic:**

- V1 cookies are detected on the client with `detectV1CookieItems(document.cookie)`, which parses
  `item-<id>` cookies plus `currency-balance-<symbol>` for supported currency symbols (currently
  only `dUSD` via `legacyV1ItemIdMap`).
- V2 localStorage detection reads `gameState` / `gameStateBackup`, parses JSON safely, and
  accepts either a `versionNumberString`/`versionNumber` prefix of `1`/`2` or a v2-shaped payload
  containing `inventory`, `quests`, or `processes`.
- Shared detection entry point:
  `frontend/src/utils/legacySaveDetection.ts`
  (`detectLegacyArtifacts`).

**Merge vs. replace semantics:**

- **V1 → V3:** `importV1V3` adds counts to the current inventory (merge) or starts from an empty
  validated state (replace). The `LegacySaveUpgrade` UI calls `importV1V3` with
  `grantUpgradeTrophy: true` in the current codebase, so successful v1 imports grant the **Early
  Adopter Token** and the **V2 Upgrade Trophy** when legacy items are imported (see
  `frontend/src/utils/gameState.js`).
- **V2 → V3:** `importV2V3` replaces the current save with the legacy state, and
  `mergeLegacyStateIntoCurrent` combines inventory while preserving existing quests/processes.
- Both flows update `versionNumberString` to `3` and persist to IndexedDB via
  `persistMigratedState` in `frontend/src/utils/gameState.js`.

**Cleanup behavior:**

- V1 cleanup expires each detected `item-<id>` and `currency-balance-dUSD` cookie (see
  `frontend/src/components/svelte/LegacySaveUpgrade.svelte`).
  Other legacy cookies (ex: `quest-`, `checkpoint-`) are not cleared.
- V2 cleanup deletes `gameState` / `gameStateBackup` during v2 → v3 migrations (when IndexedDB is
  in use) and also via the **Delete v2 localStorage** action in the Legacy Save Upgrade UI. Both
  flows are best-effort (they skip removal if IndexedDB is unavailable or the browser is already
  using localStorage for the active save).
- The **Clear v3 save for testing** action (available when QA cheats are enabled) only removes v3
  persistence data; it preserves legacy v2 `gameState` / `gameStateBackup` entries if they still
  contain v2-formatted saves.

## QA seeding

QA seeding writes known-good fixtures that match the above schemas and is available when the QA
cheats panel is enabled. QA cheat availability is controlled by `DSPACE_ENV` via
`frontend/src/utils/cheatsAvailability.ts`.

- **V1 seed:**
  `frontend/src/utils/legacySaveSeeding.ts`
  reads
  `frontend/src/utils/legacySaveFixtures/legacy_v1_cookie_save.json`.
- **V2 seed:**
  `frontend/src/utils/legacySaveSeeding.ts`
  reads
  `frontend/src/utils/legacySaveFixtures/legacy_v2_localstorage_save.json`.

The `/settings` seeder exposes two v1 profiles (minimal + maximal) and three v2.1 profiles
(minimal, in-progress, messy), and reports which keys were written after each seed action in the
QA cheats panel summary.

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
