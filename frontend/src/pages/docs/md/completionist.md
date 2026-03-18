---
title: 'Completionist'
slug: 'completionist'
---

Completionist quests build practical progression through the completionist skill tree. This page is a QA-oriented map of quest dependencies, process IO, and inventory gates.

## Quest tree

1. [Congrats on finishing all the quests available in v2!](/quests/completionist/v2)
2. [Polish Your Trophy](/quests/completionist/polish)
3. [Catalog Your Trophy](/quests/completionist/catalog)
4. [Show Off Your Trophy](/quests/completionist/display)
5. [Check for New Quests](/quests/completionist/reminder)
6. [Forge the Completionist Award III](/quests/completionist/award-iii)

## 1) Congrats on finishing all the quests available in v2! (`completionist/v2`)

- Quest link: [/quests/completionist/v2](/quests/completionist/v2)
- Unlock prerequisite:
    - `requiresQuests`: `welcome/howtodoquests`, `ubi/basicincome`, `3dprinter/start`, `aquaria/water-testing`, `energy/solar`, `rocketry/parachute`, `hydroponics/basil`
- Dialogue `requiresItems` gates:
    - `safety-brief` → "Safety checks complete, proceed" — safety goggles ×1
    - `prep-printer` → "Printer is leveled and loaded with buffer filament" — entry-level FDM 3D printer (leveled bed) ×1, white PLA filament ×200
    - `verify-core` → "Core is stable and within tolerance" — Completionist Award II core ×1
    - `print-plate` → "Plate fits the recess" — Completionist Award II core ×1, Completionist Award II nameplate ×1
    - `assemble` → "Award is bonded, aligned, and cured" — Completionist Award II ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Green Thumb Award ×1
- Processes used:
    - [level-3d-printer-bed](/processes/level-3d-printer-bed)
        - Requires: entry-level FDM 3D printer ×1, sheet of printer paper ×1, safety goggles ×1
        - Consumes: none
        - Creates: entry-level FDM 3D printer (leveled bed) ×1
    - [print-completionist-core](/processes/print-completionist-core)
        - Requires: entry-level FDM 3D printer (leveled bed) ×1
        - Consumes: white PLA filament ×150, dWatt ×1200
        - Creates: Completionist Award II core ×1
    - [print-completionist-plate](/processes/print-completionist-plate)
        - Requires: entry-level FDM 3D printer (leveled bed) ×1
        - Consumes: white PLA filament ×30, dWatt ×250
        - Creates: Completionist Award II nameplate ×1
    - [assemble-completionist-award-ii](/processes/assemble-completionist-award-ii)
        - Requires: Sandpaper pack ×1, superglue ×1
        - Consumes: Completionist Award II core ×1, Completionist Award II nameplate ×1, Sandpaper pack ×0.1, superglue ×0.1
        - Creates: Completionist Award II ×1

## 2) Polish Your Trophy (`completionist/polish`)

- Quest link: [/quests/completionist/polish](/quests/completionist/polish)
- Unlock prerequisite:
    - `requiresQuests`: `completionist/v2`
- Dialogue `requiresItems` gates:
    - `start` → "Absolutely, let's polish it" — Completionist Award II ×1
    - `prep` → "First polish pass complete" — Completionist Award II (polished) ×1
    - `inspect` → "Surface is clear and dry, done" — Completionist Award II (polished) ×1
    - `recovery` → "Second pass done, re-inspect" — Completionist Award II (polished) ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Completionist Award ×1
- Processes used:
    - [polish-completionist-award](/processes/polish-completionist-award)
        - Requires: liquid soap ×1, Completionist Award II ×1, paper towel ×1
        - Consumes: paper towel ×0.1, Completionist Award II ×1
        - Creates: Completionist Award II (polished) ×1

## 3) Catalog Your Trophy (`completionist/catalog`)

- Quest link: [/quests/completionist/catalog](/quests/completionist/catalog)
- Unlock prerequisite:
    - `requiresQuests`: `completionist/polish`
- Dialogue `requiresItems` gates:
    - `start` → "Yeah, let's catalog it" — Completionist Award II (polished) ×1
    - `prep` → "I have an entry ready for review" — Completionist Award II (polished) ×1, completionist trophy log entry ×1
    - `review` → "Entry includes all required fields" — completionist trophy log entry ×1
    - `audit-window` → "Audit pass: complete and readable record" — completionist trophy log entry ×1
    - `incident-response` → "Corrections done, rerun review" — completionist trophy log entry ×1
    - `fix-entry` → "Retake complete, review again" — completionist trophy log entry ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Completionist Award ×1
- Processes used:
    - [record-completionist-award-entry](/processes/record-completionist-award-entry)
        - Requires: mission logbook ×1, smartphone ×1, Completionist Award II (polished) ×1
        - Consumes: none
        - Creates: completionist trophy log entry ×1

## 4) Show Off Your Trophy (`completionist/display`)

- Quest link: [/quests/completionist/display](/quests/completionist/display)
- Unlock prerequisite:
    - `requiresQuests`: `completionist/polish`
- Dialogue `requiresItems` gates:
    - `dust` → "Shelf is dusted and trophy gleams" — Completionist Award II (polished) ×1
    - `place` → "Award is staged with lighting" — Completionist Award II (displayed) ×1
    - `verify` → "Stable and safe, locking in the display" — Completionist Award II (displayed) ×1
    - `recover` → "Restaged and ready for verification" — Completionist Award II (displayed) ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Completionist Award ×1
- Processes used:
    - [stage-completionist-award](/processes/stage-completionist-award)
        - Requires: Bookshelf ×1, Completionist Award II (polished) ×1
        - Consumes: Completionist Award II (polished) ×1
        - Creates: Completionist Award II (displayed) ×1

## 5) Check for New Quests (`completionist/reminder`)

- Quest link: [/quests/completionist/reminder](/quests/completionist/reminder)
- Unlock prerequisite:
    - `requiresQuests`: `completionist/display`
- Dialogue `requiresItems` gates:
    - `start` → "Let's lock in a reminder plan around the displayed award" — Completionist Award II (displayed) ×1
    - `plan-window` → "Primary reminder scheduled, continue to verification" — weekly quest reminder ×1
    - `verify-reminder` → "Dry run passed: cadence, link, and timezone are all correct" — weekly quest reminder ×1
    - `recovery` → "Re-test the corrected reminder" — weekly quest reminder ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Completionist Award ×1
- Processes used:
    - [schedule-quest-reminder](/processes/schedule-quest-reminder)
        - Requires: smartphone ×1
        - Consumes: none
        - Creates: weekly quest reminder ×1

## QA flow notes

- Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
- Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
- Catalog QA: `completionist/catalog` now enforces an audit classification step (pass vs anomaly) and a corrective incident-response loop before closure.
- Display QA: `completionist/display` now has an explicit wobble/glare recovery branch and a safety verification gate before finish.
- Polish QA: `completionist/polish` now enforces a post-process inspection gate with a gentler cleanup retry path for residue.
- Reminder QA: `completionist/reminder` now adds dry-run verification for cadence/link/timezone plus a backup-alert recovery loop.
- Trophy build QA: `completionist/v2` now includes a safety preflight stop, core verification gate, and retune-and-retry recovery branch.
- Completionist capstone QA: `completionist/award-iii` should only unlock after all DAG leaves are complete and should enforce all multi-skill fabrication checkpoints before finish.
- Known pitfalls: repeated processes may generate stackable logs or outputs; validate minimum item counts on continuation options before skipping process steps.

## 6) Forge the Completionist Award III (`completionist/award-iii`)

- Quest link: [/quests/completionist/award-iii](/quests/completionist/award-iii)
- Unlock prerequisite:
    - `requiresQuests`: all leaf quests in the current v3 DAG, which is the minimal
      sufficient set to prove all currently reachable quests are complete before this quest unlocks.
- Dialogue `requiresItems` gates:
    - `print-modules` → "Printed modules are dimensionally accurate" — Completionist Award III module kit ×1
    - `wood-base` → "Pedestal is flat, sealed, and mount-ready" — Completionist Award III wood pedestal ×1
    - `electronics-harness` → "Harness passes continuity and polarity checks" — Completionist Award III smart harness ×1
    - `robotics-integration` → "Servo sweep is smooth and cable-safe" — Completionist Award III motion core ×1
    - `planter-integration` → "Planter cup is stable and irrigated" — Completionist Award III planter crown ×1
    - `final-assembly` → "Award III is complete and fully validated" — Completionist Award III ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Completionist Award III ×1
- Processes used:
    - [print-completionist-iii-modules](/processes/print-completionist-iii-modules)
        - Requires: entry-level FDM 3D printer (leveled bed) ×1
        - Consumes: white PLA filament ×260, dWatt ×2100
        - Creates: Completionist Award III module kit ×1
    - [mill-completionist-iii-wood-base](/processes/mill-completionist-iii-wood-base)
        - Requires: Handsaw ×1, Sandpaper pack ×1
        - Consumes: Pine board ×1, Wood glue ×0.2, Sandpaper pack ×0.3
        - Creates: Completionist Award III wood pedestal ×1
    - [solder-completionist-iii-harness](/processes/solder-completionist-iii-harness)
        - Requires: soldering iron kit ×1, flux pen ×1, safety goggles ×1
        - Consumes: solder wick ×0.2, dWatt ×40
        - Creates: Completionist Award III smart harness ×1
    - [integrate-completionist-iii-robotics](/processes/integrate-completionist-iii-robotics)
        - Requires: Servo Motor ×1, precision screwdriver set ×1, Completionist Award III smart harness ×1, Completionist Award III module kit ×1
        - Consumes: Completionist Award III smart harness ×1, Completionist Award III module kit ×1, dWatt ×25
        - Creates: Completionist Award III motion core ×1
    - [assemble-completionist-iii-planter](/processes/assemble-completionist-iii-planter)
        - Requires: Completionist Award III motion core ×1, hydroponic starter plug ×1, basil seedling ×1
        - Consumes: Completionist Award III motion core ×1, hydroponic starter plug ×1, basil seedling ×1
        - Creates: Completionist Award III planter crown ×1
    - [assemble-completionist-award-iii](/processes/assemble-completionist-award-iii)
        - Requires: Completionist Award III wood pedestal ×1, Completionist Award III planter crown ×1, superglue ×1
        - Consumes: Completionist Award III wood pedestal ×1, Completionist Award III planter crown ×1, superglue ×0.2
        - Creates: Completionist Award III ×1
