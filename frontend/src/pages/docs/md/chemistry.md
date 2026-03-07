---
title: 'Chemistry'
slug: 'chemistry'
---

Chemistry quests now emphasize **artifact-driven lab work**: every major transformation should leave a tangible
inventory result (sample, log, adjusted solution, or waste package) that can be validated in later steps.

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
- Key gates now require evidence artifacts:
    - `open-beaker`/`controlled-capture` → requires `fizz reaction cylinder sample`
    - `verify`/`finish` → requires `safe fizz reaction log sheet`
- Processes:
    - [/processes/run-safe-fizz-reaction](/processes/run-safe-fizz-reaction) → creates `fizz reaction cylinder sample`
    - [/processes/log-safe-reaction](/processes/log-safe-reaction) → creates `safe fizz reaction log sheet`

## 2) Measure Solution pH (`chemistry/ph-test`)

- Requires: `chemistry/safe-reaction`
- Measurement and interpretation gates now use `chemistry pH reading card`
- Process:
    - [/processes/chemistry-measure-ph](/processes/chemistry-measure-ph)
        - consumes `pH strip`
        - creates `chemistry pH reading card`

## 3) Dilute Hydrochloric Acid Safely (`chemistry/acid-dilution`)

- Requires: `chemistry/ph-test`
- Both route branches now run a dilution process and require `diluted hydrochloric acid solution`
- Verification/finish now require the diluted solution artifact
- Process:
    - [/processes/chemistry-dilute-hcl](/processes/chemistry-dilute-hcl)
        - consumes concentrated HCl (fractional)
        - creates `diluted hydrochloric acid solution`

## 4) Neutralize an Acid Spill (`chemistry/acid-neutralization`)

- Requires: `chemistry/ph-test`
- Kit workflow and verification require `neutralized spill waste container`; manual branch can proceed to verification with strip-based checks before confirming the container at pass gate
- Process:
    - [/processes/chemistry-neutralize-acid-spill](/processes/chemistry-neutralize-acid-spill)
        - consumes neutralizer + pH strip
        - creates `neutralized spill waste container`

## 5) Prepare a Buffer Solution (`chemistry/buffer-solution`)

- Requires: `chemistry/ph-test`, `chemistry/acid-dilution`
- Both prep branches now require paired evidence:
    - `buffer solution batch`
    - `chemistry pH reading card`
- Processes:
    - [/processes/chemistry-prepare-buffer](/processes/chemistry-prepare-buffer) → creates `buffer solution batch`
    - [/processes/chemistry-measure-ph](/processes/chemistry-measure-ph) → creates `chemistry pH reading card`

## 6) Adjust Solution pH (`chemistry/ph-adjustment`)

- Requires: `chemistry/buffer-solution`
- Baseline/retest and completion now depend on `chemistry pH reading card`
- Adjustment branch still requires/produces transformed batch evidence when corrections are needed:
    - requires `buffer solution batch`
    - creates `pH-adjusted buffer solution`
- Processes:
    - [/processes/chemistry-measure-ph](/processes/chemistry-measure-ph)
    - [/processes/chemistry-adjust-buffer-ph](/processes/chemistry-adjust-buffer-ph)

## 7) Form a Precipitate (`chemistry/precipitation-reaction`)

- Requires: `chemistry/ph-adjustment`
- Evidence pair for pass:
    - `filtered precipitate sample`
    - `chemistry pH reading card`
- Processes:
    - [/processes/chemistry-form-precipitate](/processes/chemistry-form-precipitate) → creates `precipitation reaction slurry`
    - [/processes/chemistry-filter-precipitate](/processes/chemistry-filter-precipitate) → creates `filtered precipitate sample`
    - [/processes/chemistry-measure-ph](/processes/chemistry-measure-ph)

## 8) Extract Stevia Sweetener (`chemistry/stevia-extraction`)

- Requires: `hydroponics/stevia`, `chemistry/safe-reaction`
- Continues to require `stevia extract` evidence across setup/outcome/recovery gates
- Process:
    - [/processes/extract-stevia](/processes/extract-stevia)

## 9) Refine Stevia Crystals (`chemistry/stevia-crystals`)

- Requires: `chemistry/stevia-extraction`
- Continues to require `stevia crystals` evidence before completion
- Process:
    - [/processes/purify-stevia](/processes/purify-stevia)

## 10) Taste Test Stevia Crystals (`chemistry/stevia-tasting`)

- Requires: `chemistry/stevia-crystals`
- Continues staged evidence model:
    - setup artifact: `stevia tasting solution`
    - outcome artifact: `stevia tasting notes`
- Processes:
    - [/processes/mix-stevia-tasting-solution](/processes/mix-stevia-tasting-solution)
    - [/processes/record-stevia-tasting-notes](/processes/record-stevia-tasting-notes)

## QA checklist focus

- Verify every chemistry quest branch has a tangible evidence artifact before finish.
- Verify transformed states propagate through inventory (`buffer batch` → `adjusted buffer` → `precipitate outputs`).
- Verify waste/disposal artifacts are produced for hazardous chemistry steps.

### Process-gate balancing note

To prevent instant completion via previously accumulated inventory, process-output gate requirements were tightened in:
- `chemistry/acid-neutralization`
- `chemistry/buffer-solution`
- `chemistry/ph-test`
- `chemistry/precipitation-reaction`
- `chemistry/stevia-crystals`

