---
title: 'Chemistry'
slug: 'chemistry'
---

Chemistry quests build practical progression through the chemistry skill tree. This page is a QA-oriented map of quest dependencies, process IO, and inventory gates.

## Quest tree

1. [Demonstrate a Safe Chemical Reaction](/quests/chemistry/safe-reaction)
2. [Measure Solution pH](/quests/chemistry/ph-test)
3. [Dilute Hydrochloric Acid Safely](/quests/chemistry/acid-dilution)
4. [Neutralize an Acid Spill](/quests/chemistry/acid-neutralization)
5. [Prepare a Buffer Solution](/quests/chemistry/buffer-solution)
6. [Adjust Solution pH](/quests/chemistry/ph-adjustment)
7. [Form a Precipitate](/quests/chemistry/precipitation-reaction)
8. [Extract Stevia Sweetener](/quests/chemistry/stevia-extraction)
9. [Refine Stevia Crystals](/quests/chemistry/stevia-crystals)
10. [Taste Test Stevia Crystals](/quests/chemistry/stevia-tasting)

## 1) Demonstrate a Safe Chemical Reaction (`chemistry/safe-reaction`)

- Quest link: [/quests/chemistry/safe-reaction](/quests/chemistry/safe-reaction)
- Unlock prerequisite:
    - `requiresQuests`: `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
    - None
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [neutralize-acid](/processes/neutralize-acid)
        - Requires: TBD (known gap; process IO not yet specified)
        - Consumes: TBD (known gap; process IO not yet specified)
        - Creates: TBD (known gap; process IO not yet specified)

## 2) Measure Solution pH (`chemistry/ph-test`)

- Quest link: [/quests/chemistry/ph-test](/quests/chemistry/ph-test)
- Unlock prerequisite:
    - `requiresQuests`: `chemistry/safe-reaction`
- Dialogue `requiresItems` gates:
    - `measure` → "Result logged" — pH strip ×1, nitrile gloves (pair) ×1, safety goggles ×1, lab coat ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [measure-ph](/processes/measure-ph)
        - Requires: hydroponics tub (ready) ×1, nitrile gloves (pair) ×1, safety goggles ×1, 100 mL graduated cylinder ×1
        - Consumes: pH strip ×1
        - Creates: hydroponic pH reading ×1

## 3) Dilute Hydrochloric Acid Safely (`chemistry/acid-dilution`)

- Quest link: [/quests/chemistry/acid-dilution](/quests/chemistry/acid-dilution)
- Unlock prerequisite:
    - `requiresQuests`: `chemistry/ph-test`
- Dialogue `requiresItems` gates:
    - `dilute` → "Solution mixed safely." — 250 mL glass beaker ×1, glass stir rod ×1, nitrile gloves (pair) ×1, safety goggles ×1, lab coat ×1, pH strip ×1, hydrochloric acid (37%, 500 mL) ×1, spill tray ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [wash-hands](/processes/wash-hands)
        - Requires: sink ×1
        - Consumes: liquid soap ×1, paper towel ×1
        - Creates: none

## 4) Neutralize an Acid Spill (`chemistry/acid-neutralization`)

- Quest link: [/quests/chemistry/acid-neutralization](/quests/chemistry/acid-neutralization)
- Unlock prerequisite:
    - `requiresQuests`: `chemistry/ph-test`
- Dialogue `requiresItems` gates:
    - `verify` → "The spill is neutralized." — pH strip ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [neutralize-acid](/processes/neutralize-acid)
        - Requires: TBD (known gap; process IO not yet specified)
        - Consumes: TBD (known gap; process IO not yet specified)
        - Creates: TBD (known gap; process IO not yet specified)

## 5) Prepare a Buffer Solution (`chemistry/buffer-solution`)

- Quest link: [/quests/chemistry/buffer-solution](/quests/chemistry/buffer-solution)
- Unlock prerequisite:
    - `requiresQuests`: `chemistry/ph-test`
- Dialogue `requiresItems` gates:
    - `mix` → "pH is stable around 7." — pH strip ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [measure-ph](/processes/measure-ph)
        - Requires: hydroponics tub (ready) ×1, nitrile gloves (pair) ×1, safety goggles ×1, 100 mL graduated cylinder ×1
        - Consumes: pH strip ×1
        - Creates: hydroponic pH reading ×1

## 6) Adjust Solution pH (`chemistry/ph-adjustment`)

- Quest link: [/quests/chemistry/ph-adjustment](/quests/chemistry/ph-adjustment)
- Unlock prerequisite:
    - `requiresQuests`: `chemistry/buffer-solution`
- Dialogue `requiresItems` gates:
    - `adjust` → "The pH is on target." — pH strip ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [adjust-ph](/processes/adjust-ph)
        - Requires: nitrile gloves (pair) ×1, safety goggles ×1, glass stir rod ×1, pH down solution (500 mL) ×1, pH up solution (potassium carbonate) ×1
        - Consumes: pH down solution (500 mL) ×0.05, pH up solution (potassium carbonate) ×0.05
        - Creates: none

## 7) Form a Precipitate (`chemistry/precipitation-reaction`)

- Quest link: [/quests/chemistry/precipitation-reaction](/quests/chemistry/precipitation-reaction)
- Unlock prerequisite:
    - `requiresQuests`: `chemistry/ph-adjustment`
- Dialogue `requiresItems` gates:
    - `mix` → "A solid precipitate settles." — pH strip ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [wash-hands](/processes/wash-hands)
        - Requires: sink ×1
        - Consumes: liquid soap ×1, paper towel ×1
        - Creates: none

## 8) Extract Stevia Sweetener (`chemistry/stevia-extraction`)

- Quest link: [/quests/chemistry/stevia-extraction](/quests/chemistry/stevia-extraction)
- Unlock prerequisite:
    - `requiresQuests`: `hydroponics/stevia`, `chemistry/safe-reaction`
- Dialogue `requiresItems` gates:
    - `extract` → "The extract looks ready!" — stevia extract ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [extract-stevia](/processes/extract-stevia)
        - Requires: none
        - Consumes: bundle of stevia leaves ×10
        - Creates: stevia extract ×1

## 9) Refine Stevia Crystals (`chemistry/stevia-crystals`)

- Quest link: [/quests/chemistry/stevia-crystals](/quests/chemistry/stevia-crystals)
- Unlock prerequisite:
    - `requiresQuests`: `chemistry/stevia-extraction`
- Dialogue `requiresItems` gates:
    - `purify` → "I see white crystals!" — stevia crystals ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [purify-stevia](/processes/purify-stevia)
        - Requires: none
        - Consumes: stevia extract ×1
        - Creates: stevia crystals ×1

## 10) Taste Test Stevia Crystals (`chemistry/stevia-tasting`)

- Quest link: [/quests/chemistry/stevia-tasting](/quests/chemistry/stevia-tasting)
- Unlock prerequisite:
    - `requiresQuests`: `chemistry/stevia-crystals`
- Dialogue `requiresItems` gates:
    - `start` → "Gloves and goggles on." — nitrile gloves (pair) ×1, safety goggles ×1
    - `prep` → "Solution mixed and labeled." — stevia crystals ×1, nitrile gloves (pair) ×1, safety goggles ×1, 250 mL glass beaker ×1, 100 mL graduated cylinder ×1, glass stir rod ×1
    - `taste` → "Logged flavor notes." — stevia tasting solution ×1, mission logbook ×1
    - `finish` → "Ready for the next batch." — stevia tasting notes ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [mix-stevia-tasting-solution](/processes/mix-stevia-tasting-solution)
        - Requires: nitrile gloves (pair) ×1, safety goggles ×1, 250 mL glass beaker ×1, 100 mL graduated cylinder ×1, glass stir rod ×1
        - Consumes: stevia crystals ×0.05
        - Creates: stevia tasting solution ×1
    - [record-stevia-tasting-notes](/processes/record-stevia-tasting-notes)
        - Requires: stevia tasting solution ×1, mission logbook ×1
        - Consumes: stevia tasting solution ×1
        - Creates: stevia tasting notes ×1

## QA flow notes

- Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
- Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
- Known pitfalls: repeated processes may generate stackable logs or outputs; validate minimum item counts on continuation options before skipping process steps.
