---
title: 'Chemistry'
slug: 'chemistry'
---

Chemistry quests now require **full bench protocol evidence**: apparatus staging, solvent/reagent handling,
and post-step records. Each quest now adds new process artifacts so QA can verify both setup and outcome.

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

## Main path + branch notes

The chemistry tree remains linear in quest unlock order, but each quest now includes explicit multi-process
lab phases (setup -> execution -> verification) with dedicated artifacts for each phase.

## Per-quest protocol updates

### 1) `chemistry/safe-reaction`

- New setup artifacts:
    - `safe reaction bench setup sheet`
    - `safe reaction dosing tray`
- Updated process chain:
    - [/processes/chemistry-stage-safe-reaction-bench](/processes/chemistry-stage-safe-reaction-bench)
    - [/processes/chemistry-dose-safe-reaction-reagents](/processes/chemistry-dose-safe-reaction-reagents)
    - [/processes/run-safe-fizz-reaction](/processes/run-safe-fizz-reaction)
    - [/processes/log-safe-reaction](/processes/log-safe-reaction)

### 2) `chemistry/ph-test`

- New setup artifacts:
    - `pH kit calibration log`
    - `conditioned pH sample vial`
- Updated process chain:
    - [/processes/chemistry-calibrate-ph-kit](/processes/chemistry-calibrate-ph-kit)
    - [/processes/chemistry-condition-ph-sample](/processes/chemistry-condition-ph-sample)
    - [/processes/chemistry-measure-ph](/processes/chemistry-measure-ph)

### 3) `chemistry/acid-dilution`

- New setup artifacts:
    - `HCl dilution molarity worksheet`
    - `ice-bath dilution flask`
- Updated process chain:
    - [/processes/chemistry-calculate-hcl-dilution](/processes/chemistry-calculate-hcl-dilution)
    - [/processes/chemistry-prechill-dilution-flask](/processes/chemistry-prechill-dilution-flask)
    - [/processes/chemistry-dilute-hcl](/processes/chemistry-dilute-hcl)

### 4) `chemistry/acid-neutralization`

- New setup/disposal artifacts:
    - `acid spill containment berm`
    - `sealed neutralization residue drum`
- Updated process chain:
    - [/processes/chemistry-deploy-spill-containment-berm](/processes/chemistry-deploy-spill-containment-berm)
    - [/processes/chemistry-neutralize-acid-spill](/processes/chemistry-neutralize-acid-spill)
    - [/processes/chemistry-package-neutralized-residue](/processes/chemistry-package-neutralized-residue)

### 5) `chemistry/buffer-solution`

- New formulation artifacts:
    - `buffer formulation recipe card`
    - `compounded buffer stock lot`
- Updated process chain:
    - [/processes/chemistry-calculate-buffer-recipe](/processes/chemistry-calculate-buffer-recipe)
    - [/processes/chemistry-compound-buffer-stock](/processes/chemistry-compound-buffer-stock)
    - [/processes/chemistry-measure-ph](/processes/chemistry-measure-ph)
    - Existing quest grant remains `buffer solution batch`.

### 6) `chemistry/ph-adjustment`

- New adjustment artifacts:
    - `buffer adjustment titration plan`
    - `buffer adjustment cycle log`
- Updated process chain:
    - [/processes/chemistry-plan-ph-adjustment](/processes/chemistry-plan-ph-adjustment)
    - [/processes/chemistry-execute-ph-adjustment-cycle](/processes/chemistry-execute-ph-adjustment-cycle)
    - [/processes/chemistry-measure-ph](/processes/chemistry-measure-ph)
    - [/processes/chemistry-adjust-buffer-ph](/processes/chemistry-adjust-buffer-ph)

### 7) `chemistry/precipitation-reaction`

- New solids-workup artifacts:
    - `precipitation reagent staging set`
    - `washed precipitate cake`
- Updated process chain:
    - [/processes/chemistry-prepare-precipitation-reagent-set](/processes/chemistry-prepare-precipitation-reagent-set)
    - [/processes/chemistry-form-precipitate](/processes/chemistry-form-precipitate)
    - [/processes/chemistry-age-and-wash-precipitate](/processes/chemistry-age-and-wash-precipitate)
    - [/processes/chemistry-filter-precipitate](/processes/chemistry-filter-precipitate)
    - [/processes/chemistry-measure-ph](/processes/chemistry-measure-ph)

### 8) `chemistry/stevia-extraction`

- New extraction intermediates:
    - `milled stevia feedstock`
    - `clarified stevia filtrate`
- Updated process chain:
    - [/processes/chemistry-prep-stevia-feedstock](/processes/chemistry-prep-stevia-feedstock)
    - [/processes/chemistry-run-stevia-solvent-wash](/processes/chemistry-run-stevia-solvent-wash)
    - [/processes/extract-stevia](/processes/extract-stevia)

### 9) `chemistry/stevia-crystals`

- New crystallization intermediates:
    - `seeded stevia crystal slurry`
    - `dried stevia crystal lot`
- Updated process chain:
    - [/processes/chemistry-seed-stevia-crystallization](/processes/chemistry-seed-stevia-crystallization)
    - [/processes/chemistry-dry-stevia-crystal-lot](/processes/chemistry-dry-stevia-crystal-lot)
    - [/processes/purify-stevia](/processes/purify-stevia)

### 10) `chemistry/stevia-tasting`

- New sensory QA artifacts:
    - `stevia sensory calibration cup set`
    - `stevia panel scorecard`
- Updated process chain:
    - [/processes/chemistry-calibrate-stevia-tasting-panel](/processes/chemistry-calibrate-stevia-tasting-panel)
    - [/processes/mix-stevia-tasting-solution](/processes/mix-stevia-tasting-solution)
    - [/processes/chemistry-run-stevia-sensory-panel](/processes/chemistry-run-stevia-sensory-panel)
    - [/processes/record-stevia-tasting-notes](/processes/record-stevia-tasting-notes)

## QA checklist focus

- Verify every chemistry quest now has at least one setup artifact and one outcome artifact.
- Verify all new process outputs are referenced by quest gates (no orphan artifacts).
- Verify stevia path records solvent handling, thermal limits, and sensory protocol reproducibility.
