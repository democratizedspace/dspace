---
title: 'Completionist'
slug: 'completionist'
---

Completionist quests build practical progression through the completionist skill tree. This page is a QA-oriented map of quest dependencies, process IO, and inventory gates.

## Quest tree

1. [Congrats for finishing all the quests!!](/quests/completionist/v2)
2. [Catalog Your Trophy](/quests/completionist/catalog)
3. [Show Off Your Trophy](/quests/completionist/display)
4. [Polish Your Trophy](/quests/completionist/polish)
5. [Check for New Quests](/quests/completionist/reminder)

## 1) Congrats for finishing all the quests!! (`completionist/v2`)

- Quest link: [/quests/completionist/v2](/quests/completionist/v2)
- Unlock prerequisite:
    - `requiresQuests`: `welcome/howtodoquests`, `ubi/basicincome`, `3dprinter/start`, `aquaria/water-testing`, `energy/solar`, `rocketry/parachute`, `hydroponics/basil`
- Dialogue `requiresItems` gates:
    - `prep-printer` → "Printer is leveled and loaded" — entry-level FDM 3D printer (leveled bed) ×1, white PLA filament ×150
    - `print-core` → "Core is printed and cool" — Completionist Award II core ×1
    - `print-plate` → "Plate fits the recess" — Completionist Award II core ×1, Completionist Award II nameplate ×1
    - `assemble` → "Award is bonded and cured" — Completionist Award II ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
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

## 2) Catalog Your Trophy (`completionist/catalog`)

- Quest link: [/quests/completionist/catalog](/quests/completionist/catalog)
- Unlock prerequisite:
    - `requiresQuests`: `completionist/v2`
- Dialogue `requiresItems` gates:
    - `start` → "Yeah, let's catalog it" — Completionist Award II ×1
    - `prep` → "Entry saved with serial and placement noted" — Completionist Award II ×1, completionist trophy log entry ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [record-completionist-award-entry](/processes/record-completionist-award-entry)
        - Requires: mission logbook ×1, smartphone ×1, Completionist Award II ×1
        - Consumes: none
        - Creates: completionist trophy log entry ×1

## 3) Show Off Your Trophy (`completionist/display`)

- Quest link: [/quests/completionist/display](/quests/completionist/display)
- Unlock prerequisite:
    - `requiresQuests`: `completionist/v2`
- Dialogue `requiresItems` gates:
    - `start` → "Let's find the perfect spot" — Completionist Award II ×1
    - `dust` → "Shelf is dusted and trophy gleams" — Completionist Award II (polished) ×1
    - `place` → "Award is staged with lighting" — Completionist Award II (displayed) ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [polish-completionist-award](/processes/polish-completionist-award)
        - Requires: liquid soap ×1, Completionist Award II ×1, paper towel ×1
        - Consumes: paper towel ×0.1, Completionist Award II ×1
        - Creates: Completionist Award II (polished) ×1
    - [stage-completionist-award](/processes/stage-completionist-award)
        - Requires: Bookshelf ×1, Completionist Award II (polished) ×1
        - Consumes: Completionist Award II (polished) ×1
        - Creates: Completionist Award II (displayed) ×1

## 4) Polish Your Trophy (`completionist/polish`)

- Quest link: [/quests/completionist/polish](/quests/completionist/polish)
- Unlock prerequisite:
    - `requiresQuests`: `completionist/v2`
- Dialogue `requiresItems` gates:
    - `start` → "Absolutely, let's polish it" — Completionist Award II ×1
    - `prep` → "Here it is, sparkling" — Completionist Award II (polished) ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [polish-completionist-award](/processes/polish-completionist-award)
        - Requires: liquid soap ×1, Completionist Award II ×1, paper towel ×1
        - Consumes: paper towel ×0.1, Completionist Award II ×1
        - Creates: Completionist Award II (polished) ×1

## 5) Check for New Quests (`completionist/reminder`)

- Quest link: [/quests/completionist/reminder](/quests/completionist/reminder)
- Unlock prerequisite:
    - `requiresQuests`: `completionist/polish`
- Dialogue `requiresItems` gates:
    - `start` → "I'll check back" — Completionist Award II ×1
    - `remind` → "Reminder set" — weekly quest reminder ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [schedule-quest-reminder](/processes/schedule-quest-reminder)
        - Requires: smartphone ×1
        - Consumes: none
        - Creates: weekly quest reminder ×1

## QA flow notes

- Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
- Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
- Known pitfalls: repeated processes may generate stackable logs or outputs; validate minimum item counts on continuation options before skipping process steps.
