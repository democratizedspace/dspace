---
title: 'Chemistry'
slug: 'chemistry'
---

Chemistry quests now run as **full lab workflows**: each quest requires explicit setup artifacts,
process records, and closeout evidence (not just a final product item).

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

- Requires: `welcome/howtodoquests`
- Main artifacts:
    - `fizz apparatus setup checklist`
    - `safe fizz reaction log sheet`
    - `neutralized fizz waste vial`
- Processes:
    - [/processes/chemistry-stage-fizz-apparatus](/processes/chemistry-stage-fizz-apparatus)
    - [/processes/run-safe-fizz-reaction](/processes/run-safe-fizz-reaction)
    - [/processes/log-safe-reaction](/processes/log-safe-reaction)
    - [/processes/chemistry-quench-fizz-residue](/processes/chemistry-quench-fizz-residue)

## 2) Measure Solution pH (`chemistry/ph-test`)

- Requires: `chemistry/safe-reaction`
- Main artifacts:
    - `labeled aliquot vial`
    - `two-point calibration log`
    - `chemistry pH reading card`
- Processes:
    - [/processes/chemistry-prepare-ph-aliquot](/processes/chemistry-prepare-ph-aliquot)
    - [/processes/chemistry-calibrate-ph-reference](/processes/chemistry-calibrate-ph-reference)
    - [/processes/chemistry-measure-ph](/processes/chemistry-measure-ph)

## 3) Dilute Hydrochloric Acid Safely (`chemistry/acid-dilution`)

- Requires: `chemistry/ph-test`
- Main artifacts:
    - `acid dilution calculation sheet`
    - `ice bath temperature log`
    - `diluted hydrochloric acid solution`
- Processes:
    - [/processes/chemistry-calc-acid-dilution](/processes/chemistry-calc-acid-dilution)
    - [/processes/chemistry-stage-dilution-ice-bath](/processes/chemistry-stage-dilution-ice-bath)
    - [/processes/chemistry-dilute-hcl](/processes/chemistry-dilute-hcl)

## 4) Neutralize an Acid Spill (`chemistry/acid-neutralization`)

- Requires: `chemistry/ph-test`
- Main artifacts:
    - `spill boundary map card`
    - `neutralized spill waste container`
    - `sealed neutralization waste manifest`
- Processes:
    - [/processes/chemistry-map-spill-boundary](/processes/chemistry-map-spill-boundary)
    - [/processes/chemistry-neutralize-acid-spill](/processes/chemistry-neutralize-acid-spill)
    - [/processes/chemistry-manifest-neutralized-waste](/processes/chemistry-manifest-neutralized-waste)

## 5) Prepare a Buffer Solution (`chemistry/buffer-solution`)

- Requires: `chemistry/ph-test`, `chemistry/acid-dilution`
- Main artifacts:
    - `buffer reagent weigh boat`
    - `buffer solution batch`
    - `buffer stock bottle`
    - `chemistry pH reading card`
- Processes:
    - [/processes/chemistry-weigh-buffer-reagents](/processes/chemistry-weigh-buffer-reagents)
    - [/processes/chemistry-prepare-buffer](/processes/chemistry-prepare-buffer)
    - [/processes/chemistry-bottle-buffer-stock](/processes/chemistry-bottle-buffer-stock)
    - [/processes/chemistry-measure-ph](/processes/chemistry-measure-ph)

## 6) Adjust Solution pH (`chemistry/ph-adjustment`)

- Requires: `chemistry/buffer-solution`
- Main artifacts:
    - `titration increment log`
    - `pH-adjusted buffer solution`
    - `30-minute drift check card`
- Processes:
    - [/processes/chemistry-log-titration-increments](/processes/chemistry-log-titration-increments)
    - [/processes/chemistry-adjust-buffer-ph](/processes/chemistry-adjust-buffer-ph)
    - [/processes/chemistry-run-drift-hold](/processes/chemistry-run-drift-hold)

## 7) Form a Precipitate (`chemistry/precipitation-reaction`)

- Requires: `chemistry/ph-adjustment`
- Main artifacts:
    - `reagent compatibility worksheet`
    - `filtered precipitate sample`
    - `dried precipitate mass record`
- Processes:
    - [/processes/chemistry-verify-precipitation-compatibility](/processes/chemistry-verify-precipitation-compatibility)
    - [/processes/chemistry-form-precipitate](/processes/chemistry-form-precipitate)
    - [/processes/chemistry-filter-precipitate](/processes/chemistry-filter-precipitate)
    - [/processes/chemistry-dry-precipitate-and-log-mass](/processes/chemistry-dry-precipitate-and-log-mass)

## 8) Extract Stevia Sweetener (`chemistry/stevia-extraction`)

- Requires: `hydroponics/stevia`, `chemistry/safe-reaction`
- Main artifacts:
    - `rinsed stevia leaf tray`
    - `stevia ethanol macerate`
    - `de-solvated stevia concentrate`
    - `stevia extract`
- Processes:
    - [/processes/chemistry-rinse-stevia-leaves](/processes/chemistry-rinse-stevia-leaves)
    - [/processes/chemistry-macerate-stevia-ethanol](/processes/chemistry-macerate-stevia-ethanol)
    - [/processes/chemistry-rotovap-stevia-concentrate](/processes/chemistry-rotovap-stevia-concentrate)

## 9) Refine Stevia Crystals (`chemistry/stevia-crystals`)

- Requires: `chemistry/stevia-extraction`
- Main artifacts:
    - `seeded stevia crystallization jar`
    - `stevia crystals`
    - `dried stevia crystal lot sheet`
- Processes:
    - [/processes/chemistry-seed-stevia-crystallization](/processes/chemistry-seed-stevia-crystallization)
    - [/processes/purify-stevia](/processes/purify-stevia)
    - [/processes/chemistry-vacuum-dry-stevia-crystals](/processes/chemistry-vacuum-dry-stevia-crystals)

## 10) Taste Test Stevia Crystals (`chemistry/stevia-tasting`)

- Requires: `chemistry/stevia-crystals`
- Main artifacts:
    - `palate calibration sheet`
    - `stevia dilution ladder set`
    - `stevia tasting notes`
- Processes:
    - [/processes/chemistry-calibrate-palate-panel](/processes/chemistry-calibrate-palate-panel)
    - [/processes/chemistry-build-stevia-dilution-ladder](/processes/chemistry-build-stevia-dilution-ladder)
    - [/processes/mix-stevia-tasting-solution](/processes/mix-stevia-tasting-solution)
    - [/processes/record-stevia-tasting-notes](/processes/record-stevia-tasting-notes)

## QA checklist focus

- Verify every chemistry quest has setup, transformation, and closeout artifacts.
- Verify stevia extraction now includes wash, solvent extraction, and solvent recovery stages.
- Verify each hazardous workflow includes explicit containment and disposal documentation.
