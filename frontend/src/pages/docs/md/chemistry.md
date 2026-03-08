---
title: 'Chemistry'
slug: 'chemistry'
---

Chemistry quests now emphasize **artifact-driven lab work** with explicit equipment, solvent handling,
and traceability logs. Every quest now has an additional QA evidence gate before finish.

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
- Pass evidence now requires:
    - `safe fizz reaction log sheet`
    - `fizz reaction thermal log sheet`
- Processes:
    - [/processes/run-safe-fizz-reaction](/processes/run-safe-fizz-reaction)
    - [/processes/log-safe-reaction](/processes/log-safe-reaction)
    - [/processes/chemistry-log-fizz-thermals](/processes/chemistry-log-fizz-thermals)

## 2) Measure Solution pH (`chemistry/ph-test`)

- Requires: `chemistry/safe-reaction`
- Pass evidence now requires:
    - `chemistry pH reading card`
    - `chemistry pH trend worksheet`
- Processes:
    - [/processes/chemistry-measure-ph](/processes/chemistry-measure-ph)
    - [/processes/chemistry-log-ph-trend](/processes/chemistry-log-ph-trend)

## 3) Dilute Hydrochloric Acid Safely (`chemistry/acid-dilution`)

- Requires: `chemistry/ph-test`
- Pass evidence now requires:
    - `diluted hydrochloric acid solution`
    - `acid labeling audit checklist`
- Processes:
    - [/processes/chemistry-dilute-hcl](/processes/chemistry-dilute-hcl)
    - [/processes/chemistry-verify-acid-labeling](/processes/chemistry-verify-acid-labeling)

## 4) Neutralize an Acid Spill (`chemistry/acid-neutralization`)

- Requires: `chemistry/ph-test`
- Pass evidence now requires:
    - `neutralized spill waste container`
    - `neutralization endpoint checklist`
- Processes:
    - [/processes/chemistry-neutralize-acid-spill](/processes/chemistry-neutralize-acid-spill)
    - [/processes/chemistry-verify-neutralization-endpoint](/processes/chemistry-verify-neutralization-endpoint)

## 5) Prepare a Buffer Solution (`chemistry/buffer-solution`)

- Requires: `chemistry/ph-test`, `chemistry/acid-dilution`
- Pass evidence now requires:
    - `buffer solution batch`
    - `chemistry pH reading card`
    - `acetate buffer batch sheet`
- Processes:
    - [/processes/chemistry-prepare-buffer](/processes/chemistry-prepare-buffer)
    - [/processes/chemistry-measure-ph](/processes/chemistry-measure-ph)
    - [/processes/chemistry-document-buffer-batch](/processes/chemistry-document-buffer-batch)

## 6) Adjust Solution pH (`chemistry/ph-adjustment`)

- Requires: `chemistry/buffer-solution`
- Pass evidence now requires:
    - `chemistry pH reading card`
    - `pH stability hold record`
- Processes:
    - [/processes/chemistry-measure-ph](/processes/chemistry-measure-ph)
    - [/processes/chemistry-adjust-buffer-ph](/processes/chemistry-adjust-buffer-ph)
    - [/processes/chemistry-run-ph-stability-hold](/processes/chemistry-run-ph-stability-hold)

## 7) Form a Precipitate (`chemistry/precipitation-reaction`)

- Requires: `chemistry/ph-adjustment`
- Pass evidence now requires:
    - `filtered precipitate sample`
    - `chemistry pH reading card`
    - `precipitate mass and yield card`
- Processes:
    - [/processes/chemistry-form-precipitate](/processes/chemistry-form-precipitate)
    - [/processes/chemistry-filter-precipitate](/processes/chemistry-filter-precipitate)
    - [/processes/chemistry-measure-ph](/processes/chemistry-measure-ph)
    - [/processes/chemistry-dry-and-weigh-precipitate](/processes/chemistry-dry-and-weigh-precipitate)

## 8) Extract Stevia Sweetener (`chemistry/stevia-extraction`)

- Requires: `hydroponics/stevia`, `chemistry/safe-reaction`
- Pass evidence now requires:
    - `stevia extract`
    - `rotovap stevia concentrate lot`
- Processes:
    - [/processes/extract-stevia](/processes/extract-stevia)
    - [/processes/chemistry-rotovap-stevia-extract](/processes/chemistry-rotovap-stevia-extract)

## 9) Refine Stevia Crystals (`chemistry/stevia-crystals`)

- Requires: `chemistry/stevia-extraction`
- Pass evidence now requires:
    - `stevia crystals`
    - `vacuum-dried stevia crystal lot`
- Processes:
    - [/processes/purify-stevia](/processes/purify-stevia)
    - [/processes/chemistry-vacuum-dry-stevia-crystals](/processes/chemistry-vacuum-dry-stevia-crystals)

## 10) Taste Test Stevia Crystals (`chemistry/stevia-tasting`)

- Requires: `chemistry/stevia-crystals`
- Pass evidence now requires:
    - `stevia tasting notes`
    - `stevia sensory scorecard`
- Processes:
    - [/processes/mix-stevia-tasting-solution](/processes/mix-stevia-tasting-solution)
    - [/processes/record-stevia-tasting-notes](/processes/record-stevia-tasting-notes)
    - [/processes/chemistry-record-sensory-panel](/processes/chemistry-record-sensory-panel)

## QA checklist focus

- Verify every chemistry quest branch has an evidence artifact before `finish`.
- Verify new QA artifact items are reachable from their associated process.
- Verify hazardous chemistry still emits disposal/readiness artifacts and not just narrative text.
