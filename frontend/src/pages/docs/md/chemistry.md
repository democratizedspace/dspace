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
    - `safety` → "Safety gear is on and tools are ready." — nitrile gloves (pair) ×1, safety goggles ×1, 250 mL glass beaker ×1, 100 mL graduated cylinder ×1
    - `open-beaker` → "Reaction remained controlled; move to verification and logging." — spent fizz-reaction solution cylinder ×1
    - `controlled-capture` → "Capture route completed with stable behavior; move to verification and logging." — spent fizz-reaction solution cylinder ×1
    - `verify` → "Stable run documented; proceed to closeout." — safe reaction observation log ×1
    - `finish` → "Logged and ready for the next experiment." — safe reaction observation log ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - dChat ×1, dUSD ×1000
- Processes used:
    - [run-safe-fizz-reaction](/processes/run-safe-fizz-reaction)
        - Requires: nitrile gloves (pair) ×1, safety goggles ×1, 250 mL glass beaker ×1, 100 mL graduated cylinder ×1
        - Consumes: none
        - Creates: spent fizz-reaction solution cylinder ×1
    - [log-safe-reaction](/processes/log-safe-reaction)
        - Requires: 250 mL glass beaker ×1, spent fizz-reaction solution cylinder ×1
        - Consumes: none
        - Creates: safe reaction observation log ×1
    - [wash-hands](/processes/wash-hands)
        - Requires: sink ×1
        - Consumes: liquid soap ×1, paper towel ×1
        - Creates: none
- QA notes:
    - Reaction flow now leaves a physical post-run artifact and a separate reproducibility log artifact.
    - Troubleshooting still enforces stop-work cleanup and route reselection before completion.


## 2) Measure Solution pH (`chemistry/ph-test`)

- Quest link: [/quests/chemistry/ph-test](/quests/chemistry/ph-test)
- Unlock prerequisite:
    - `requiresQuests`: `chemistry/safe-reaction`
- Dialogue `requiresItems` gates:
    - `measure` → "I logged a stable reading and kept PPE on." — hydroponic pH reading ×1, nitrile gloves (pair) ×1, safety goggles ×1, lab coat ×1
    - `interpret` → "Reading is in-range (6.0–7.5); safe to proceed." — hydroponic pH reading ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - stevia crystals ×1
- Processes used:
    - [measure-ph](/processes/measure-ph)
        - Requires: hydroponics tub (ready) ×1, nitrile gloves (pair) ×1, safety goggles ×1, 100 mL graduated cylinder ×1
        - Consumes: pH strip ×1
        - Creates: hydroponic pH reading ×1
- QA notes:
    - Explicit interpretation gate enforces a pass window (pH 6.0–7.5) before finish.
    - Out-of-range/ambiguous readings must route through troubleshooting, then re-test or safe escalation.

## 3) Dilute Hydrochloric Acid Safely (`chemistry/acid-dilution`)

- Quest link: [/quests/chemistry/acid-dilution](/quests/chemistry/acid-dilution)
- Unlock prerequisite:
    - `requiresQuests`: `chemistry/ph-test`
- Dialogue `requiresItems` gates:
    - `start` → "Bench is staged and PPE is confirmed." — nitrile gloves (pair) ×1, safety goggles ×1, lab coat ×1, spill tray ×1
    - `micro-batch` → "Micro-batch dilution complete; verify pH." — diluted hydrochloric acid sample ×1, nitrile gloves (pair) ×1, safety goggles ×1
    - `staged-pour` → "Staged pour complete; run verification." — diluted hydrochloric acid sample ×1, nitrile gloves (pair) ×1, safety goggles ×1
    - `verify` → "Reading logged and dilution is stable for storage." — diluted hydrochloric acid sample ×1, hydroponic pH reading ×1
    - `finish` → "Safety first." — diluted hydrochloric acid sample ×1, hydroponic pH reading ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - stevia tasting solution ×1
- Processes used:
    - [perform-acid-dilution](/processes/perform-acid-dilution)
        - Requires: nitrile gloves (pair) ×1, safety goggles ×1, 250 mL glass beaker ×1, 100 mL graduated cylinder ×1, hydrochloric acid (37%, 500 mL) ×1
        - Consumes: hydrochloric acid (37%, 500 mL) ×0.05
        - Creates: diluted hydrochloric acid sample ×1
    - [wash-hands](/processes/wash-hands)
        - Requires: sink ×1
        - Consumes: liquid soap ×1, paper towel ×1
        - Creates: none
- QA notes:
    - Both dilution paths now materialize a labeled diluted sample as evidence before verification.
    - Recovery path still handles splash/heat/fume anomalies and loops back to method selection.


## 4) Neutralize an Acid Spill (`chemistry/acid-neutralization`)

- Quest link: [/quests/chemistry/acid-neutralization](/quests/chemistry/acid-neutralization)
- Unlock prerequisite:
    - `requiresQuests`: `chemistry/ph-test`
- Dialogue `requiresItems` gates:
    - `kit-response` → "Kit run complete; verify with pH strip." — neutralized spill slurry container ×1
    - `manual-response` → "Manual neutralization complete; proceed to pH verification." — neutralized spill slurry container ×1
    - `verify` → "Verification passed: spill zone is neutral and controlled." — neutralized spill slurry container ×1, hydroponic pH reading ×1
    - `finish` → "Neutralization protocol complete." — neutralized spill slurry container ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - stevia tasting solution ×1
- Processes used:
    - [neutralize-acid-spill](/processes/neutralize-acid-spill)
        - Requires: nitrile gloves (pair) ×1, safety goggles ×1, diluted hydrochloric acid sample ×1, pH up solution (potassium carbonate) ×1
        - Consumes: diluted hydrochloric acid sample ×1, pH up solution (potassium carbonate) ×0.05
        - Creates: neutralized spill slurry container ×1
- QA notes:
    - Both response branches now converge on the same tangible neutralization artifact.
    - Verification requires both chemical neutralization evidence and a pH reading artifact.


## 5) Prepare a Buffer Solution (`chemistry/buffer-solution`)

- Quest link: [/quests/chemistry/buffer-solution](/quests/chemistry/buffer-solution)
- Unlock prerequisite:
    - `requiresQuests`: `chemistry/acid-neutralization`, `chemistry/acid-dilution`
- Dialogue `requiresItems` gates:
    - `measured-mix` → "Measured batch logged—review stability window." — buffered solution aliquot ×1, hydroponic pH reading ×1, lab coat ×1, spill tray ×1
    - `pilot-mix` → "Pilot data captured—evaluate against pass bounds." — buffered solution aliquot ×1, hydroponic pH reading ×1, lab coat ×1
    - `interpret` → "Reading is stable and in-range (6.8–7.2)." — buffered solution aliquot ×1, hydroponic pH reading ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - stevia tasting solution ×1
- Processes used:
    - [prepare-buffer-solution](/processes/prepare-buffer-solution)
        - Requires: nitrile gloves (pair) ×1, safety goggles ×1, 250 mL glass beaker ×1, glass stir rod ×1, pH down solution (500 mL) ×1, pH up solution (potassium carbonate) ×1
        - Consumes: pH down solution (500 mL) ×0.03, pH up solution (potassium carbonate) ×0.03
        - Creates: buffered solution aliquot ×1
    - [measure-ph](/processes/measure-ph)
        - Requires: hydroponics tub (ready) ×1, nitrile gloves (pair) ×1, safety goggles ×1, 100 mL graduated cylinder ×1
        - Consumes: pH strip ×1
        - Creates: hydroponic pH reading ×1
    - [wash-hands](/processes/wash-hands)
        - Requires: sink ×1
        - Consumes: liquid soap ×1, paper towel ×1
        - Creates: none
- QA notes:
    - Non-linear prep routes now produce a persistent buffer aliquot artifact before interpretation.
    - Recovery path retains contamination control and retry-or-escalate behavior.


## 6) Adjust Solution pH (`chemistry/ph-adjustment`)

- Quest link: [/quests/chemistry/ph-adjustment](/quests/chemistry/ph-adjustment)
- Unlock prerequisite:
    - `requiresQuests`: `chemistry/buffer-solution`
- Dialogue `requiresItems` gates:
    - `start` → "Run baseline measurement with PPE on." — nitrile gloves (pair) ×1, safety goggles ×1, hydroponics tub (ready) ×1
    - `baseline` → "Baseline recorded, interpret before adjusting." — hydroponic pH reading ×1
    - `interpret` → "Reading is within 6.0-7.2; no further adjustment needed." — hydroponic pH reading ×1
    - `adjust` → "Adjustment complete, collect verification reading." — pH-adjusted nutrient solution sample ×1, nitrile gloves (pair) ×1, safety goggles ×1
    - `retest` → "Verification is inside 6.0-7.2." — hydroponic pH reading ×1
    - `finish` → "Chemistry in harmony." — hydroponic pH reading ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - 250 mL glass beaker ×1
- Processes used:
    - [measure-ph](/processes/measure-ph)
        - Requires: hydroponics tub (ready) ×1, nitrile gloves (pair) ×1, safety goggles ×1, 100 mL graduated cylinder ×1
        - Consumes: pH strip ×1
        - Creates: hydroponic pH reading ×1
    - [adjust-ph](/processes/adjust-ph)
        - Requires: nitrile gloves (pair) ×1, safety goggles ×1, glass stir rod ×1, pH down solution (500 mL) ×1, pH up solution (potassium carbonate) ×1
        - Consumes: pH down solution (500 mL) ×0.05, pH up solution (potassium carbonate) ×0.05
        - Creates: pH-adjusted nutrient solution sample ×1
    - [wash-hands](/processes/wash-hands)
        - Requires: sink ×1
        - Consumes: liquid soap ×1, paper towel ×1
        - Creates: none
- QA notes:
    - Adjustment path now materializes a corrected-solution artifact before post-adjustment measurement.
    - Out-of-range correction still loops through adjust -> retest with a safety-stop branch.


## 7) Form a Precipitate (`chemistry/precipitation-reaction`)

- Quest link: [/quests/chemistry/precipitation-reaction](/quests/chemistry/precipitation-reaction)
- Unlock prerequisite:
    - `requiresQuests`: `chemistry/ph-adjustment`
- Dialogue `requiresItems` gates:
    - `mix` → "I captured a visible precipitate plus a stable reading." — precipitate slurry vial ×1, hydroponic pH reading ×1
    - `interpret` → "Pass: precipitate is stable and pH is 6.0–8.0." — precipitate slurry vial ×1, hydroponic pH reading ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - stevia crystals ×1
- Processes used:
    - [form-precipitate-sample](/processes/form-precipitate-sample)
        - Requires: nitrile gloves (pair) ×1, safety goggles ×1, 250 mL glass beaker ×1, 100 mL graduated cylinder ×1, pH up solution (potassium carbonate) ×1, pH down solution (500 mL) ×1
        - Consumes: pH up solution (potassium carbonate) ×0.03, pH down solution (500 mL) ×0.03
        - Creates: precipitate slurry vial ×1
    - [measure-ph](/processes/measure-ph)
        - Requires: hydroponics tub (ready) ×1, nitrile gloves (pair) ×1, safety goggles ×1, 100 mL graduated cylinder ×1
        - Consumes: pH strip ×1
        - Creates: hydroponic pH reading ×1
    - [wash-hands](/processes/wash-hands)
        - Requires: sink ×1
        - Consumes: liquid soap ×1, paper towel ×1
        - Creates: none
- QA notes:
    - Precipitation now creates a preserved slurry sample before interpretation.
    - Corrective loop still includes cleanup, retrial, and safe pause after repeated failures.


## 8) Extract Stevia Sweetener (`chemistry/stevia-extraction`)

- Quest link: [/quests/chemistry/stevia-extraction](/quests/chemistry/stevia-extraction)
- Unlock prerequisite:
    - `requiresQuests`: `hydroponics/stevia`, `chemistry/safe-reaction`
- Dialogue `requiresItems` gates:
    - `precision-setup` → "Extraction evidence captured; evaluate extract clarity." — stevia extract ×1
    - `pilot-setup` → "Pilot indicates viable extraction; check outcome evidence." — stevia extract ×1
    - `outcome-check` → "Outcome passes quality check; extract is ready." — stevia extract ×1
    - `contamination-recovery` → "Paused safely after documenting a valid extract and logged deferred extraction for maintenance." — stevia extract ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - stevia crystals ×1
- Processes used:
    - [extract-stevia](/processes/extract-stevia)
        - Requires: none
        - Consumes: bundle of stevia leaves ×10
        - Creates: stevia extract ×1
- QA notes:
    - Staged evidence is split between extraction-route evidence and an outcome quality gate before finish.
    - Contamination recovery includes sanitize-and-rerun workflow plus safe pause/escalation path.

## 9) Refine Stevia Crystals (`chemistry/stevia-crystals`)

- Quest link: [/quests/chemistry/stevia-crystals](/quests/chemistry/stevia-crystals)
- Unlock prerequisite:
    - `requiresQuests`: `chemistry/stevia-extraction`
- Dialogue `requiresItems` gates:
    - `controlled-setup` → "Controlled run complete—evaluate crystal outcome." — stevia crystals ×1
    - `seed-setup` → "Seed batch produced crystals—review quality gate." — stevia crystals ×1
    - `outcome-check` → "Outcome passes—crystals are dry and clean." — stevia crystals ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - 250 mL glass beaker ×1
- Processes used:
    - [purify-stevia](/processes/purify-stevia)
        - Requires: none
        - Consumes: stevia extract ×1
        - Creates: stevia crystals ×1
    - [wash-hands](/processes/wash-hands)
        - Requires: sink ×1
        - Consumes: liquid soap ×1, paper towel ×1
        - Creates: none
- QA notes:
    - Lifecycle flow now separates setup-route evidence from outcome quality gates.
    - Recovery branch adds solvent-safety controls, sanitize-and-retry, and a safe pause path.

## 10) Taste Test Stevia Crystals (`chemistry/stevia-tasting`)

- Quest link: [/quests/chemistry/stevia-tasting](/quests/chemistry/stevia-tasting)
- Unlock prerequisite:
    - `requiresQuests`: `chemistry/stevia-crystals`
- Dialogue `requiresItems` gates:
    - `start` → "Gloves and goggles on." — nitrile gloves (pair) ×1, safety goggles ×1
    - `precision-setup` → "Setup artifact captured; proceed to outcome check." — stevia tasting solution ×1
    - `panel-setup` → "Comparative setup ready; move to blind taste logging." — stevia tasting solution ×1
    - `outcome-check` → "Outcome artifact logged with clear notes." — stevia tasting notes ×1
    - `finish` → "Ready for the next batch." — stevia tasting notes ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - stevia tasting solution ×1
- Processes used:
    - [mix-stevia-tasting-solution](/processes/mix-stevia-tasting-solution)
        - Requires: nitrile gloves (pair) ×1, safety goggles ×1, 250 mL glass beaker ×1, 100 mL graduated cylinder ×1, glass stir rod ×1
        - Consumes: stevia crystals ×0.05
        - Creates: stevia tasting solution ×1
    - [record-stevia-tasting-notes](/processes/record-stevia-tasting-notes)
        - Requires: stevia tasting solution ×1, mission logbook ×1
        - Consumes: stevia tasting solution ×1
        - Creates: stevia tasting notes ×1
    - [wash-hands](/processes/wash-hands)
        - Requires: sink ×1
        - Consumes: liquid soap ×1, paper towel ×1
        - Creates: none
- QA notes:
    - Lifecycle progression now requires staged evidence (setup artifact before outcome artifact).
    - Recovery branch covers contamination/palate-fatigue handling with retry and defer options.

## QA flow notes

- Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
- Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
- Known pitfalls: repeated processes may generate stackable logs or outputs; validate minimum item counts on continuation options before skipping process steps.
