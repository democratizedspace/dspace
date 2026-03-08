---
title: 'Chemistry'
slug: 'chemistry'
---

Chemistry quests now model **full lab workflows**: setup artifacts, stepwise procedures, and
recordkeeping are all required before a branch can complete.

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

1. **`chemistry/safe-reaction`**
    - New gate artifact: `safe reaction rig checklist`
    - Main/branch flows both require containment + PPE staging before reaction evidence review.
    - Processes:
        - [/processes/chemistry-stage-safe-fizz-rig](/processes/chemistry-stage-safe-fizz-rig)
        - [/processes/run-safe-fizz-reaction](/processes/run-safe-fizz-reaction)
        - [/processes/log-safe-reaction](/processes/log-safe-reaction)

2. **`chemistry/ph-test`**
    - New gate artifact: `pH calibration record card`
    - Adds 3-point calibration (pH 4/7/10) before sampling.
    - Processes:
        - [/processes/chemistry-stage-ph-meter-calibration](/processes/chemistry-stage-ph-meter-calibration)
        - [/processes/chemistry-measure-ph](/processes/chemistry-measure-ph)

3. **`chemistry/acid-dilution`**
    - New gate artifact: `acid dilution lab worksheet`
    - Branches now require explicit C1V1 planning and water-first staging before dilution run.
    - Processes:
        - [/processes/chemistry-stage-acid-dilution-glassware](/processes/chemistry-stage-acid-dilution-glassware)
        - [/processes/chemistry-dilute-hcl](/processes/chemistry-dilute-hcl)

4. **`chemistry/acid-neutralization`**
    - New gate artifact: `acid spill response log`
    - Kit/manual branches both start with perimeter documentation and neutralizer sequence planning.
    - Processes:
        - [/processes/chemistry-stage-spill-response-kit](/processes/chemistry-stage-spill-response-kit)
        - [/processes/chemistry-neutralize-acid-spill](/processes/chemistry-neutralize-acid-spill)

5. **`chemistry/buffer-solution`**
    - New gate artifact: `buffer formulation worksheet`
    - Requires formulation math and flask assignment before mixing.
    - Processes:
        - [/processes/chemistry-stage-buffer-formulation](/processes/chemistry-stage-buffer-formulation)
        - [/processes/chemistry-prepare-buffer](/processes/chemistry-prepare-buffer)
        - [/processes/chemistry-measure-ph](/processes/chemistry-measure-ph)

6. **`chemistry/ph-adjustment`**
    - New gate artifact: `incremental titration chart`
    - Adds micro-addition planning and settle windows before correction loops.
    - Processes:
        - [/processes/chemistry-stage-ph-titration-plan](/processes/chemistry-stage-ph-titration-plan)
        - [/processes/chemistry-adjust-buffer-ph](/processes/chemistry-adjust-buffer-ph)
        - [/processes/chemistry-measure-ph](/processes/chemistry-measure-ph)

7. **`chemistry/precipitation-reaction`**
    - New gate artifact: `precipitation addition schedule`
    - Requires reagent-order and filtration planning before slurry generation.
    - Processes:
        - [/processes/chemistry-stage-precipitation-addition-plan](/processes/chemistry-stage-precipitation-addition-plan)
        - [/processes/chemistry-form-precipitate](/processes/chemistry-form-precipitate)
        - [/processes/chemistry-filter-precipitate](/processes/chemistry-filter-precipitate)

8. **`chemistry/stevia-extraction`**
    - New gate artifact: `stevia solvent extraction protocol`
    - Extraction is now multi-step:
        - solvent/extractor preflight,
        - ethanol maceration to `macerated stevia ethanol eluate`,
        - solvent recovery/concentration to final `stevia extract`.
    - Processes:
        - [/processes/chemistry-stage-stevia-solvent-extraction](/processes/chemistry-stage-stevia-solvent-extraction)
        - [/processes/chemistry-macerate-stevia-leaves](/processes/chemistry-macerate-stevia-leaves)
        - [/processes/extract-stevia](/processes/extract-stevia)

9. **`chemistry/stevia-crystals`**
    - New gate artifact: `stevia recrystallization worksheet`
    - Adds solvent-split, seed mass, and vacuum-dry planning before crystal refinement.
    - Processes:
        - [/processes/chemistry-stage-stevia-recrystallization](/processes/chemistry-stage-stevia-recrystallization)
        - [/processes/purify-stevia](/processes/purify-stevia)

10. **`chemistry/stevia-tasting`**
    - New gate artifact: `stevia sensory panel sheet`
    - Requires blind coding + palate reset cadence before panel run.
    - Processes:
        - [/processes/chemistry-stage-stevia-sensory-panel](/processes/chemistry-stage-stevia-sensory-panel)
        - [/processes/mix-stevia-tasting-solution](/processes/mix-stevia-tasting-solution)
        - [/processes/record-stevia-tasting-notes](/processes/record-stevia-tasting-notes)

## QA checklist focus

- Verify every chemistry quest path requires both a setup record and an outcome artifact.
- Verify stevia extraction requires staged protocol + eluate intermediate before final extract.
- Verify process pages resolve for all new chemistry-stage process IDs.
