# v3 quest quality review: manual QA signal vs newly added quest content

## Why this doc exists

The v3 QA checklist already has a quest-by-quest validation list in
`docs/qa/v3.md` §4.5. At the time of writing, 16 quests are checked, while 221 remain unchecked.
Most unchecked quests are newly added in v3 (`docs/new-quests.md`) and deserve focused quality review
before release hardening.

This doc compares the checked quests against unchecked quests, identifies recurring anti-patterns
in lower-quality entries, and proposes concrete documentation improvements for both humans and LLM
agents authoring quests.

## Scope and method

- Source of checked/unchecked status: `docs/qa/v3.md` §4.5.
- Source of “new in v3” status: `docs/new-quests.md`.
- Source of content quality observations: quest JSON under
  `frontend/src/pages/quests/json/<tree>/<quest>.json`.

Interpretation rule for this document:

- “Checked quests” always means entries marked checked in `docs/qa/v3.md` §4.5.
- “New in v3” always means quests listed in `docs/new-quests.md`.

Quick quantitative scan (scripted locally):

- Scan run on **2026-02-16** at commit **`80eb7ce9dc11c30817089a511277fc29832026f2`**.
- Reproduction method: parse quest IDs from `docs/qa/v3.md` §4.5, intersect with `docs/new-quests.md`, then compute structural counts from corresponding quest JSON files.

- Checked quests: **16**
- Unchecked quests: **221**
- Checked quests that are new in v3: **15/16**
- Unchecked quests that are new in v3: **221/221**

Average structural complexity (dialogue graph only):

- Checked quests: **8.81 dialogue nodes**, **15.81 options**, **2.12 process options**,
  **3.19 gated options**, **2.19 quiz-like nodes**.
- Unchecked quests: **3.81 dialogue nodes**, **5.31 options**, **1.17 process options**,
  **1.95 gated options**, **~0 quiz-like nodes**.

## Manually validated quest set (from `docs/qa/v3.md` §4.5)

Checked quest IDs (16 total):

- `3dprinting/start`
- `composting/check-temperature`
- `composting/sift-compost`
- `composting/start`
- `composting/turn-pile`
- `hydroponics/basil`
- `hydroponics/nutrient-check`
- `sysadmin/basic-commands`
- `sysadmin/log-analysis`
- `sysadmin/resource-monitoring`
- `ubi/basicincome`
- `welcome/connect-github`
- `welcome/howtodoquests`
- `welcome/intro-inventory`
- `welcome/run-tests`
- `welcome/smart-plug-test`

Exemplars from the checked set (what they do well):

- `hydroponics/nutrient-check`: ties progress to concrete process + item gating, not just narration.
- `sysadmin/basic-commands`: includes interpretation checks that build operator literacy and recap.
- `composting/start`: combines setup/safety/science checkpoints with retry loops.
- `welcome/run-tests`: bridges player action to next-step workflow expectations.

Contrast with unchecked quests that are also listed as new in v3 (`docs/new-quests.md`):

- `astronomy/saturn-rings`: currently tends toward a thin shell (observe then finish) with little
  troubleshooting path.
- `devops/fail2ban`: lacks explicit staged verification artifacts for install/config/validate flow.
- `energy/dWatt-1e8`: accumulation-heavy target with limited strategic branching.
- `programming/web-server`: can finish without strong failure-mode handling or evidence artifacts.

## What the checked quests are doing better

Checked quests are not uniformly perfect, but they more often demonstrate:

1. **Interaction depth**
   - Multi-step progression with explicit setup, execution, and validation flow.
   - Example: `composting/start` walks through UX, materials, safety/science, and quiz retries.
2. **Mechanic grounding**
   - Uses DSPACE mechanics directly (processes on item pages, gated transitions, item proofs).
   - Example: `hydroponics/nutrient-check` uses multiple process steps plus item gates.
3. **Operator literacy / explainability**
   - Some quests teach reasoning rather than only requiring a single item threshold.
   - Example: `sysadmin/basic-commands` includes command interpretation and knowledge checks.
4. **Safety and reproducibility cues**
   - Better entries include concrete safety behavior and realistic sequencing.

## Common anti-patterns in unchecked quests (especially new in v3)

1. **Three-node “thin shell” quests**
   - Pattern: `start -> instruction -> finish` with one gate and no branching.
   - Risk: feels transactional, low retention, easy to auto-generate but not meaningful.

2. **Checklist prose without in-game verification**
   - Long instruction text appears in one node, but there is little/no mechanic-level evidence that
     the player performed intermediate steps.

3. **Progress by accumulation only (numeric grind ladders)**
   - Especially visible in `energy/dWatt-*` style quests.
   - Risk: inflated goals with minimal narrative/mechanical variety.

4. **Generic rewards and weak differentiation**
   - Many quests grant the same trophy-like item regardless of topic/effort.
   - Risk: progression and domain identity blur together.

5. **Hardening metadata optimism without corresponding depth**
   - Some quests have high scores or pass markers while still structurally thin.
   - Risk: hardening fields become decorative instead of quality evidence.

6. **Terminology and identity drift**
   - Example: file path `electronics/soldering-intro.json` has ID `electronics/tin-soldering-iron`.
   - Risk: harder diagnostics, author confusion, and weaker canonical mapping.

## Problematic quests to prioritize (with improvement checklist)

Use this as an actionable backlog for quest polishing passes. This section now enumerates **every unchecked quest that was newly added in v3**.

- Newly added in v3 (`docs/new-quests.md`): **236**
- Checked in `docs/qa/v3.md` §4.5 that are also new in v3: **15**
- Remaining newly added v3 quests with quality gaps to prioritize: **221**

### 3dprinting (15 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `3dprinting/start` and `composting/start`.

- `3dprinting/bed-leveling`
  - [ ] **Branching idea:** split `3dprinting/bed-leveling` into a main `bed leveling` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `bed leveling` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `3dprinting/benchy_10`
  - [ ] **Branching idea:** split `3dprinting/benchy_10` into a main `benchy 10` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `benchy 10` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `3dprinting/benchy_100`
  - [ ] **Branching idea:** split `3dprinting/benchy_100` into a main `benchy 100` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `benchy 100` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `3dprinting/benchy_25`
  - [ ] **Branching idea:** split `3dprinting/benchy_25` into a main `benchy 25` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `benchy 25` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `3dprinting/blob-of-death`
  - [ ] **Branching idea:** split `3dprinting/blob-of-death` into a main `blob of death` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `blob of death` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `3dprinting/cable-clip`
  - [ ] **Branching idea:** split `3dprinting/cable-clip` into a main `cable clip` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `cable clip` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `3dprinting/calibration-cube`
  - [ ] **Branching idea:** split `3dprinting/calibration-cube` into a main `calibration cube` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `calibration cube` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `3dprinting/filament-change`
  - [ ] **Branching idea:** split `3dprinting/filament-change` into a main `filament change` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `filament change` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `3dprinting/nozzle-cleaning`
  - [ ] **Branching idea:** split `3dprinting/nozzle-cleaning` into a main `nozzle cleaning` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `nozzle cleaning` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `3dprinting/nozzle-clog`
  - [ ] **Branching idea:** split `3dprinting/nozzle-clog` into a main `nozzle clog` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `nozzle clog` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `3dprinting/phone-stand`
  - [ ] **Branching idea:** split `3dprinting/phone-stand` into a main `phone stand` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `phone stand` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `3dprinting/retraction-test`
  - [ ] **Branching idea:** split `3dprinting/retraction-test` into a main `retraction test` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `retraction test` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `3dprinting/spool-holder`
  - [ ] **Branching idea:** split `3dprinting/spool-holder` into a main `spool holder` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `spool holder` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `3dprinting/temperature-tower`
  - [ ] **Branching idea:** split `3dprinting/temperature-tower` into a main `temperature tower` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `temperature tower` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `3dprinting/x-belt-tension`
  - [ ] **Branching idea:** split `3dprinting/x-belt-tension` into a main `x belt tension` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `x belt tension` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.

### aquaria (19 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `hydroponics/nutrient-check` and `composting/start`.

- `aquaria/aquarium-light`
  - [ ] **Branching idea:** split `aquaria/aquarium-light` into a main `aquarium light` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `aquarium light` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `aquaria/balance-ph`
  - [ ] **Branching idea:** split `aquaria/balance-ph` into a main `balance ph` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `balance ph` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `aquaria/breeding`
  - [ ] **Branching idea:** split `aquaria/breeding` into a main `breeding` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require two staged artifacts (setup proof, then outcome proof) so completion cannot skip the intermediate mechanic.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `breeding` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `aquaria/filter-rinse`
  - [ ] **Branching idea:** split `aquaria/filter-rinse` into a main `filter rinse` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `filter rinse` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `aquaria/floating-plants`
  - [ ] **Branching idea:** split `aquaria/floating-plants` into a main `floating plants` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `floating plants` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `aquaria/goldfish`
  - [ ] **Branching idea:** split `aquaria/goldfish` into a main `goldfish` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `goldfish` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `aquaria/guppy`
  - [ ] **Branching idea:** split `aquaria/guppy` into a main `guppy` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `guppy` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `aquaria/heater-install`
  - [ ] **Branching idea:** split `aquaria/heater-install` into a main `heater install` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** gate completion on before/after verification artifacts (installation proof + post-change status check item/process output).
  - [ ] **Troubleshooting/recovery:** add a failure branch for `heater install` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `aquaria/log-water-parameters`
  - [ ] **Branching idea:** split `aquaria/log-water-parameters` into a main `log water parameters` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `log water parameters` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `aquaria/net-fish`
  - [ ] **Branching idea:** split `aquaria/net-fish` into a main `net fish` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `net fish` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `aquaria/ph-strip-test`
  - [ ] **Branching idea:** split `aquaria/ph-strip-test` into a main `ph strip test` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `ph strip test` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `aquaria/position-tank`
  - [ ] **Branching idea:** split `aquaria/position-tank` into a main `position tank` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `position tank` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `aquaria/shrimp`
  - [ ] **Branching idea:** split `aquaria/shrimp` into a main `shrimp` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `shrimp` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `aquaria/sponge-filter`
  - [ ] **Branching idea:** split `aquaria/sponge-filter` into a main `sponge filter` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `sponge filter` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `aquaria/thermometer`
  - [ ] **Branching idea:** split `aquaria/thermometer` into a main `thermometer` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `thermometer` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `aquaria/top-off`
  - [ ] **Branching idea:** split `aquaria/top-off` into a main `top off` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `top off` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `aquaria/walstad`
  - [ ] **Branching idea:** split `aquaria/walstad` into a main `walstad` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `walstad` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `aquaria/water-change`
  - [ ] **Branching idea:** split `aquaria/water-change` into a main `water change` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `water change` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `aquaria/water-testing`
  - [ ] **Branching idea:** split `aquaria/water-testing` into a main `water testing` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `water testing` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.

### astronomy (21 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `welcome/run-tests` and `sysadmin/basic-commands`.

- `astronomy/andromeda`
  - [ ] **Branching idea:** split `astronomy/andromeda` into a main `andromeda` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `andromeda` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `astronomy/aurora-watch`
  - [ ] **Branching idea:** split `astronomy/aurora-watch` into a main `aurora watch` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `aurora watch` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `astronomy/basic-telescope`
  - [ ] **Branching idea:** split `astronomy/basic-telescope` into a main `basic telescope` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `basic telescope` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `astronomy/binary-star`
  - [ ] **Branching idea:** split `astronomy/binary-star` into a main `binary star` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `binary star` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `astronomy/comet-tracking`
  - [ ] **Branching idea:** split `astronomy/comet-tracking` into a main `comet tracking` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `comet tracking` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `astronomy/constellations`
  - [ ] **Branching idea:** split `astronomy/constellations` into a main `constellations` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `constellations` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `astronomy/iss-flyover`
  - [ ] **Branching idea:** split `astronomy/iss-flyover` into a main `iss flyover` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `iss flyover` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `astronomy/iss-photo`
  - [ ] **Branching idea:** split `astronomy/iss-photo` into a main `iss photo` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `iss photo` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `astronomy/jupiter-moons`
  - [ ] **Branching idea:** split `astronomy/jupiter-moons` into a main `jupiter moons` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `jupiter moons` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `astronomy/light-pollution`
  - [ ] **Branching idea:** split `astronomy/light-pollution` into a main `light pollution` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `light pollution` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `astronomy/lunar-eclipse`
  - [ ] **Branching idea:** split `astronomy/lunar-eclipse` into a main `lunar eclipse` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `lunar eclipse` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `astronomy/meteor-shower`
  - [ ] **Branching idea:** split `astronomy/meteor-shower` into a main `meteor shower` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `meteor shower` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `astronomy/north-star`
  - [ ] **Branching idea:** split `astronomy/north-star` into a main `north star` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `north star` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `astronomy/observe-moon`
  - [ ] **Branching idea:** split `astronomy/observe-moon` into a main `observe moon` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `observe moon` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `astronomy/orion-nebula`
  - [ ] **Branching idea:** split `astronomy/orion-nebula` into a main `orion nebula` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `orion nebula` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `astronomy/planetary-alignment`
  - [ ] **Branching idea:** split `astronomy/planetary-alignment` into a main `planetary alignment` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `planetary alignment` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `astronomy/satellite-pass`
  - [ ] **Branching idea:** split `astronomy/satellite-pass` into a main `satellite pass` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `satellite pass` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `astronomy/saturn-rings`
  - [ ] **Branching idea:** split `astronomy/saturn-rings` into a main `saturn rings` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `saturn rings` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `astronomy/star-trails`
  - [ ] **Branching idea:** split `astronomy/star-trails` into a main `star trails` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `star trails` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `astronomy/sunspot-sketch`
  - [ ] **Branching idea:** split `astronomy/sunspot-sketch` into a main `sunspot sketch` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `sunspot sketch` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `astronomy/venus-phases`
  - [ ] **Branching idea:** split `astronomy/venus-phases` into a main `venus phases` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `venus phases` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.

### chemistry (10 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `composting/start` and `hydroponics/nutrient-check`.

- `chemistry/acid-dilution`
  - [ ] **Branching idea:** split `chemistry/acid-dilution` into a main `acid dilution` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `acid dilution` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `chemistry/acid-neutralization`
  - [ ] **Branching idea:** split `chemistry/acid-neutralization` into a main `acid neutralization` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `acid neutralization` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `chemistry/buffer-solution`
  - [ ] **Branching idea:** split `chemistry/buffer-solution` into a main `buffer solution` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `buffer solution` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `chemistry/ph-adjustment`
  - [ ] **Branching idea:** split `chemistry/ph-adjustment` into a main `ph adjustment` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `ph adjustment` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `chemistry/ph-test`
  - [ ] **Branching idea:** split `chemistry/ph-test` into a main `ph test` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `ph test` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `chemistry/precipitation-reaction`
  - [ ] **Branching idea:** split `chemistry/precipitation-reaction` into a main `precipitation reaction` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `precipitation reaction` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `chemistry/safe-reaction`
  - [ ] **Branching idea:** split `chemistry/safe-reaction` into a main `safe reaction` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `safe reaction` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `chemistry/stevia-crystals`
  - [ ] **Branching idea:** split `chemistry/stevia-crystals` into a main `stevia crystals` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require two staged artifacts (setup proof, then outcome proof) so completion cannot skip the intermediate mechanic.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `stevia crystals` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `chemistry/stevia-extraction`
  - [ ] **Branching idea:** split `chemistry/stevia-extraction` into a main `stevia extraction` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require two staged artifacts (setup proof, then outcome proof) so completion cannot skip the intermediate mechanic.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `stevia extraction` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `chemistry/stevia-tasting`
  - [ ] **Branching idea:** split `chemistry/stevia-tasting` into a main `stevia tasting` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require two staged artifacts (setup proof, then outcome proof) so completion cannot skip the intermediate mechanic.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `stevia tasting` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.

### completionist (5 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `welcome/howtodoquests` and `welcome/run-tests`.

- `completionist/catalog`
  - [ ] **Branching idea:** split `completionist/catalog` into a main `catalog` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `catalog` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `completionist/display`
  - [ ] **Branching idea:** split `completionist/display` into a main `display` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `display` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `completionist/polish`
  - [ ] **Branching idea:** split `completionist/polish` into a main `polish` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `polish` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `completionist/reminder`
  - [ ] **Branching idea:** split `completionist/reminder` into a main `reminder` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `reminder` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `completionist/v2`
  - [ ] **Branching idea:** split `completionist/v2` into a main `v2` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `v2` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.

### devops (15 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `sysadmin/basic-commands` and `sysadmin/log-analysis`.

- `devops/auto-updates`
  - [ ] **Branching idea:** split `devops/auto-updates` into a main `auto updates` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `auto updates` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `devops/ci-pipeline`
  - [ ] **Branching idea:** split `devops/ci-pipeline` into a main `ci pipeline` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `ci pipeline` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `devops/daily-backups`
  - [ ] **Branching idea:** split `devops/daily-backups` into a main `daily backups` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `daily backups` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `devops/docker-compose`
  - [ ] **Branching idea:** split `devops/docker-compose` into a main `docker compose` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `docker compose` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `devops/enable-https`
  - [ ] **Branching idea:** split `devops/enable-https` into a main `enable https` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `enable https` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `devops/fail2ban`
  - [ ] **Branching idea:** split `devops/fail2ban` into a main `fail2ban` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `fail2ban` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `devops/firewall-rules`
  - [ ] **Branching idea:** split `devops/firewall-rules` into a main `firewall rules` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `firewall rules` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `devops/k3s-deploy`
  - [ ] **Branching idea:** split `devops/k3s-deploy` into a main `k3s deploy` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** gate completion on before/after verification artifacts (installation proof + post-change status check item/process output).
  - [ ] **Troubleshooting/recovery:** add a failure branch for `k3s deploy` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `devops/log-maintenance`
  - [ ] **Branching idea:** split `devops/log-maintenance` into a main `log maintenance` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `log maintenance` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `devops/monitoring`
  - [ ] **Branching idea:** split `devops/monitoring` into a main `monitoring` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `monitoring` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `devops/pi-cluster-hardware`
  - [ ] **Branching idea:** split `devops/pi-cluster-hardware` into a main `pi cluster hardware` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `pi cluster hardware` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `devops/prepare-first-node`
  - [ ] **Branching idea:** split `devops/prepare-first-node` into a main `prepare first node` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `prepare first node` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `devops/private-registry`
  - [ ] **Branching idea:** split `devops/private-registry` into a main `private registry` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `private registry` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `devops/ssd-boot`
  - [ ] **Branching idea:** split `devops/ssd-boot` into a main `ssd boot` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** gate completion on before/after verification artifacts (installation proof + post-change status check item/process output).
  - [ ] **Troubleshooting/recovery:** add a failure branch for `ssd boot` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `devops/ssh-hardening`
  - [ ] **Branching idea:** split `devops/ssh-hardening` into a main `ssh hardening` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `ssh hardening` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.

### electronics (22 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `sysadmin/basic-commands` and `welcome/smart-plug-test`.

- `electronics/arduino-blink`
  - [ ] **Branching idea:** split `electronics/arduino-blink` into a main `arduino blink` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `arduino blink` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `electronics/basic-circuit`
  - [ ] **Branching idea:** split `electronics/basic-circuit` into a main `basic circuit` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `basic circuit` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `electronics/check-battery-voltage`
  - [ ] **Branching idea:** split `electronics/check-battery-voltage` into a main `check battery voltage` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `check battery voltage` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `electronics/continuity-test`
  - [ ] **Branching idea:** split `electronics/continuity-test` into a main `continuity test` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `continuity test` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `electronics/data-logger`
  - [ ] **Branching idea:** split `electronics/data-logger` into a main `data logger` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `data logger` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `electronics/desolder-component`
  - [ ] **Branching idea:** split `electronics/desolder-component` into a main `desolder component` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `desolder component` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `electronics/led-polarity`
  - [ ] **Branching idea:** split `electronics/led-polarity` into a main `led polarity` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `led polarity` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `electronics/light-sensor`
  - [ ] **Branching idea:** split `electronics/light-sensor` into a main `light sensor` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `light sensor` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `electronics/measure-arduino-5v`
  - [ ] **Branching idea:** split `electronics/measure-arduino-5v` into a main `measure arduino 5v` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `measure arduino 5v` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `electronics/measure-led-current`
  - [ ] **Branching idea:** split `electronics/measure-led-current` into a main `measure led current` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `measure led current` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `electronics/measure-resistance`
  - [ ] **Branching idea:** split `electronics/measure-resistance` into a main `measure resistance` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `measure resistance` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `electronics/potentiometer-dimmer`
  - [ ] **Branching idea:** split `electronics/potentiometer-dimmer` into a main `potentiometer dimmer` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `potentiometer dimmer` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `electronics/resistor-color-check`
  - [ ] **Branching idea:** split `electronics/resistor-color-check` into a main `resistor color check` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `resistor color check` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `electronics/servo-sweep`
  - [ ] **Branching idea:** split `electronics/servo-sweep` into a main `servo sweep` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `servo sweep` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `electronics/solder-led-harness`
  - [ ] **Branching idea:** split `electronics/solder-led-harness` into a main `solder led harness` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `solder led harness` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `electronics/solder-wire`
  - [ ] **Branching idea:** split `electronics/solder-wire` into a main `solder wire` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `solder wire` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `electronics/soldering-intro`
  - [ ] **Branching idea:** split `electronics/soldering-intro` into a main `soldering intro` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `soldering intro` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `electronics/temperature-plot`
  - [ ] **Branching idea:** split `electronics/temperature-plot` into a main `temperature plot` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `temperature plot` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `electronics/test-gfci-outlet`
  - [ ] **Branching idea:** split `electronics/test-gfci-outlet` into a main `test gfci outlet` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `test gfci outlet` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `electronics/thermistor-reading`
  - [ ] **Branching idea:** split `electronics/thermistor-reading` into a main `thermistor reading` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `thermistor reading` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `electronics/thermometer-calibration`
  - [ ] **Branching idea:** split `electronics/thermometer-calibration` into a main `thermometer calibration` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `thermometer calibration` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `electronics/voltage-divider`
  - [ ] **Branching idea:** split `electronics/voltage-divider` into a main `voltage divider` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `voltage divider` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.

### energy (11 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `welcome/smart-plug-test` and `hydroponics/nutrient-check`.

- `energy/battery-maintenance`
  - [ ] **Branching idea:** split `energy/battery-maintenance` into a main `battery maintenance` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `battery maintenance` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `energy/battery-upgrade`
  - [ ] **Branching idea:** split `energy/battery-upgrade` into a main `battery upgrade` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `battery upgrade` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `energy/biogas-digester`
  - [ ] **Branching idea:** split `energy/biogas-digester` into a main `biogas digester` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `biogas digester` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `energy/charge-controller-setup`
  - [ ] **Branching idea:** split `energy/charge-controller-setup` into a main `charge controller setup` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** gate completion on before/after verification artifacts (installation proof + post-change status check item/process output).
  - [ ] **Troubleshooting/recovery:** add a failure branch for `charge controller setup` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `energy/hand-crank-generator`
  - [ ] **Branching idea:** split `energy/hand-crank-generator` into a main `hand crank generator` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `hand crank generator` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `energy/offgrid-charger`
  - [ ] **Branching idea:** split `energy/offgrid-charger` into a main `offgrid charger` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `offgrid charger` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `energy/portable-solar-panel`
  - [ ] **Branching idea:** split `energy/portable-solar-panel` into a main `portable solar panel` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `portable solar panel` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `energy/power-inverter`
  - [ ] **Branching idea:** split `energy/power-inverter` into a main `power inverter` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `power inverter` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `energy/solar-tracker`
  - [ ] **Branching idea:** split `energy/solar-tracker` into a main `solar tracker` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `solar tracker` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `energy/solar`
  - [ ] **Branching idea:** split `energy/solar` into a main `solar` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `solar` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `energy/wind-turbine`
  - [ ] **Branching idea:** split `energy/wind-turbine` into a main `wind turbine` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `wind turbine` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.

### firstaid (13 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `composting/start` and `welcome/howtodoquests`.

- `firstaid/assemble-kit`
  - [ ] **Branching idea:** split `firstaid/assemble-kit` into a main `assemble kit` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `assemble kit` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `firstaid/change-bandage`
  - [ ] **Branching idea:** split `firstaid/change-bandage` into a main `change bandage` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `change bandage` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `firstaid/dispose-bandages`
  - [ ] **Branching idea:** split `firstaid/dispose-bandages` into a main `dispose bandages` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `dispose bandages` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `firstaid/dispose-expired`
  - [ ] **Branching idea:** split `firstaid/dispose-expired` into a main `dispose expired` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `dispose expired` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `firstaid/flashlight-battery`
  - [ ] **Branching idea:** split `firstaid/flashlight-battery` into a main `flashlight battery` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `flashlight battery` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `firstaid/learn-cpr`
  - [ ] **Branching idea:** split `firstaid/learn-cpr` into a main `learn cpr` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `learn cpr` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `firstaid/remove-splinter`
  - [ ] **Branching idea:** split `firstaid/remove-splinter` into a main `remove splinter` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `remove splinter` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `firstaid/restock-kit`
  - [ ] **Branching idea:** split `firstaid/restock-kit` into a main `restock kit` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `restock kit` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `firstaid/sanitize-pocket-mask`
  - [ ] **Branching idea:** split `firstaid/sanitize-pocket-mask` into a main `sanitize pocket mask` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `sanitize pocket mask` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `firstaid/splint-limb`
  - [ ] **Branching idea:** split `firstaid/splint-limb` into a main `splint limb` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `splint limb` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `firstaid/stop-nosebleed`
  - [ ] **Branching idea:** split `firstaid/stop-nosebleed` into a main `stop nosebleed` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `stop nosebleed` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `firstaid/treat-burn`
  - [ ] **Branching idea:** split `firstaid/treat-burn` into a main `treat burn` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `treat burn` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `firstaid/wound-care`
  - [ ] **Branching idea:** split `firstaid/wound-care` into a main `wound care` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `wound care` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.

### geothermal (15 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `hydroponics/nutrient-check` and `sysadmin/resource-monitoring`.

- `geothermal/backflush-loop-filter`
  - [ ] **Branching idea:** split `geothermal/backflush-loop-filter` into a main `backflush loop filter` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** gate completion on before/after verification artifacts (installation proof + post-change status check item/process output).
  - [ ] **Troubleshooting/recovery:** add a failure branch for `backflush loop filter` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `geothermal/calibrate-ground-sensor`
  - [ ] **Branching idea:** split `geothermal/calibrate-ground-sensor` into a main `calibrate ground sensor` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `calibrate ground sensor` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `geothermal/check-loop-inlet-temp`
  - [ ] **Branching idea:** split `geothermal/check-loop-inlet-temp` into a main `check loop inlet temp` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `check loop inlet temp` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `geothermal/check-loop-outlet-temp`
  - [ ] **Branching idea:** split `geothermal/check-loop-outlet-temp` into a main `check loop outlet temp` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `check loop outlet temp` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `geothermal/check-loop-pressure`
  - [ ] **Branching idea:** split `geothermal/check-loop-pressure` into a main `check loop pressure` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `check loop pressure` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `geothermal/check-loop-temp-delta`
  - [ ] **Branching idea:** split `geothermal/check-loop-temp-delta` into a main `check loop temp delta` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `check loop temp delta` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `geothermal/compare-depth-ground-temps`
  - [ ] **Branching idea:** split `geothermal/compare-depth-ground-temps` into a main `compare depth ground temps` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `compare depth ground temps` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `geothermal/compare-seasonal-ground-temps`
  - [ ] **Branching idea:** split `geothermal/compare-seasonal-ground-temps` into a main `compare seasonal ground temps` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `compare seasonal ground temps` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `geothermal/install-backup-thermistor`
  - [ ] **Branching idea:** split `geothermal/install-backup-thermistor` into a main `install backup thermistor` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** gate completion on before/after verification artifacts (installation proof + post-change status check item/process output).
  - [ ] **Troubleshooting/recovery:** add a failure branch for `install backup thermistor` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `geothermal/log-ground-temperature`
  - [ ] **Branching idea:** split `geothermal/log-ground-temperature` into a main `log ground temperature` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `log ground temperature` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `geothermal/log-heat-pump-warmup`
  - [ ] **Branching idea:** split `geothermal/log-heat-pump-warmup` into a main `log heat pump warmup` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `log heat pump warmup` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `geothermal/monitor-heat-pump-energy`
  - [ ] **Branching idea:** split `geothermal/monitor-heat-pump-energy` into a main `monitor heat pump energy` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `monitor heat pump energy` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `geothermal/purge-loop-air`
  - [ ] **Branching idea:** split `geothermal/purge-loop-air` into a main `purge loop air` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** gate completion on before/after verification artifacts (installation proof + post-change status check item/process output).
  - [ ] **Troubleshooting/recovery:** add a failure branch for `purge loop air` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `geothermal/replace-faulty-thermistor`
  - [ ] **Branching idea:** split `geothermal/replace-faulty-thermistor` into a main `replace faulty thermistor` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** gate completion on before/after verification artifacts (installation proof + post-change status check item/process output).
  - [ ] **Troubleshooting/recovery:** add a failure branch for `replace faulty thermistor` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `geothermal/survey-ground-temperature`
  - [ ] **Branching idea:** split `geothermal/survey-ground-temperature` into a main `survey ground temperature` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `survey ground temperature` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.

### hydroponics (21 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `hydroponics/nutrient-check` and `hydroponics/basil`.

- `hydroponics/air-stone-soak`
  - [ ] **Branching idea:** split `hydroponics/air-stone-soak` into a main `air stone soak` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `air stone soak` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `hydroponics/bucket_10`
  - [ ] **Branching idea:** split `hydroponics/bucket_10` into a main `bucket 10` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `bucket 10` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `hydroponics/ec-calibrate`
  - [ ] **Branching idea:** split `hydroponics/ec-calibrate` into a main `ec calibrate` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `ec calibrate` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `hydroponics/ec-check`
  - [ ] **Branching idea:** split `hydroponics/ec-check` into a main `ec check` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `ec check` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `hydroponics/filter-clean`
  - [ ] **Branching idea:** split `hydroponics/filter-clean` into a main `filter clean` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `filter clean` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `hydroponics/grow-light`
  - [ ] **Branching idea:** split `hydroponics/grow-light` into a main `grow light` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require two staged artifacts (setup proof, then outcome proof) so completion cannot skip the intermediate mechanic.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `grow light` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `hydroponics/lettuce`
  - [ ] **Branching idea:** split `hydroponics/lettuce` into a main `lettuce` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require two staged artifacts (setup proof, then outcome proof) so completion cannot skip the intermediate mechanic.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `lettuce` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `hydroponics/mint-cutting`
  - [ ] **Branching idea:** split `hydroponics/mint-cutting` into a main `mint cutting` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require two staged artifacts (setup proof, then outcome proof) so completion cannot skip the intermediate mechanic.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `mint cutting` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `hydroponics/netcup-clean`
  - [ ] **Branching idea:** split `hydroponics/netcup-clean` into a main `netcup clean` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `netcup clean` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `hydroponics/ph-check`
  - [ ] **Branching idea:** split `hydroponics/ph-check` into a main `ph check` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `ph check` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `hydroponics/ph-test`
  - [ ] **Branching idea:** split `hydroponics/ph-test` into a main `ph test` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `ph test` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `hydroponics/plug-soak`
  - [ ] **Branching idea:** split `hydroponics/plug-soak` into a main `plug soak` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `plug soak` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `hydroponics/pump-install`
  - [ ] **Branching idea:** split `hydroponics/pump-install` into a main `pump install` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** gate completion on before/after verification artifacts (installation proof + post-change status check item/process output).
  - [ ] **Troubleshooting/recovery:** add a failure branch for `pump install` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `hydroponics/pump-prime`
  - [ ] **Branching idea:** split `hydroponics/pump-prime` into a main `pump prime` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `pump prime` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `hydroponics/regrow-stevia`
  - [ ] **Branching idea:** split `hydroponics/regrow-stevia` into a main `regrow stevia` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require two staged artifacts (setup proof, then outcome proof) so completion cannot skip the intermediate mechanic.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `regrow stevia` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `hydroponics/reservoir-refresh`
  - [ ] **Branching idea:** split `hydroponics/reservoir-refresh` into a main `reservoir refresh` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `reservoir refresh` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `hydroponics/root-rinse`
  - [ ] **Branching idea:** split `hydroponics/root-rinse` into a main `root rinse` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `root rinse` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `hydroponics/stevia`
  - [ ] **Branching idea:** split `hydroponics/stevia` into a main `stevia` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require two staged artifacts (setup proof, then outcome proof) so completion cannot skip the intermediate mechanic.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `stevia` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `hydroponics/temp-check`
  - [ ] **Branching idea:** split `hydroponics/temp-check` into a main `temp check` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `temp check` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `hydroponics/top-off`
  - [ ] **Branching idea:** split `hydroponics/top-off` into a main `top off` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `top off` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `hydroponics/tub-scrub`
  - [ ] **Branching idea:** split `hydroponics/tub-scrub` into a main `tub scrub` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `tub scrub` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.

### programming (18 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `sysadmin/basic-commands` and `welcome/run-tests`.

- `programming/avg-temp`
  - [ ] **Branching idea:** split `programming/avg-temp` into a main `avg temp` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `avg temp` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `programming/graph-temp-data`
  - [ ] **Branching idea:** split `programming/graph-temp-data` into a main `graph temp data` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `graph temp data` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `programming/graph-temp`
  - [ ] **Branching idea:** split `programming/graph-temp` into a main `graph temp` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `graph temp` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `programming/hello-sensor`
  - [ ] **Branching idea:** split `programming/hello-sensor` into a main `hello sensor` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `hello sensor` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `programming/http-post`
  - [ ] **Branching idea:** split `programming/http-post` into a main `http post` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `http post` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `programming/json-api`
  - [ ] **Branching idea:** split `programming/json-api` into a main `json api` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `json api` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `programming/json-endpoint`
  - [ ] **Branching idea:** split `programming/json-endpoint` into a main `json endpoint` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `json endpoint` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `programming/median-temp`
  - [ ] **Branching idea:** split `programming/median-temp` into a main `median temp` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `median temp` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `programming/moving-avg-temp`
  - [ ] **Branching idea:** split `programming/moving-avg-temp` into a main `moving avg temp` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `moving avg temp` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `programming/plot-temp-cli`
  - [ ] **Branching idea:** split `programming/plot-temp-cli` into a main `plot temp cli` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `plot temp cli` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `programming/stddev-temp`
  - [ ] **Branching idea:** split `programming/stddev-temp` into a main `stddev temp` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `stddev temp` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `programming/temp-alert`
  - [ ] **Branching idea:** split `programming/temp-alert` into a main `temp alert` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `temp alert` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `programming/temp-email`
  - [ ] **Branching idea:** split `programming/temp-email` into a main `temp email` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `temp email` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `programming/temp-graph`
  - [ ] **Branching idea:** split `programming/temp-graph` into a main `temp graph` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `temp graph` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `programming/temp-json-api`
  - [ ] **Branching idea:** split `programming/temp-json-api` into a main `temp json api` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `temp json api` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `programming/temp-logger`
  - [ ] **Branching idea:** split `programming/temp-logger` into a main `temp logger` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `temp logger` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `programming/thermistor-calibration`
  - [ ] **Branching idea:** split `programming/thermistor-calibration` into a main `thermistor calibration` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `thermistor calibration` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `programming/web-server`
  - [ ] **Branching idea:** split `programming/web-server` into a main `web server` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `web server` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.

### robotics (13 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `sysadmin/resource-monitoring` and `welcome/smart-plug-test`.

- `robotics/gyro-balance`
  - [ ] **Branching idea:** split `robotics/gyro-balance` into a main `gyro balance` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `gyro balance` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `robotics/line-follower`
  - [ ] **Branching idea:** split `robotics/line-follower` into a main `line follower` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `line follower` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `robotics/maze-navigation`
  - [ ] **Branching idea:** split `robotics/maze-navigation` into a main `maze navigation` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `maze navigation` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `robotics/obstacle-avoidance`
  - [ ] **Branching idea:** split `robotics/obstacle-avoidance` into a main `obstacle avoidance` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `obstacle avoidance` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `robotics/odometry-basics`
  - [ ] **Branching idea:** split `robotics/odometry-basics` into a main `odometry basics` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `odometry basics` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `robotics/pan-tilt`
  - [ ] **Branching idea:** split `robotics/pan-tilt` into a main `pan tilt` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `pan tilt` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `robotics/reflectance-sensors`
  - [ ] **Branching idea:** split `robotics/reflectance-sensors` into a main `reflectance sensors` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `reflectance sensors` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `robotics/servo-arm`
  - [ ] **Branching idea:** split `robotics/servo-arm` into a main `servo arm` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `servo arm` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `robotics/servo-control`
  - [ ] **Branching idea:** split `robotics/servo-control` into a main `servo control` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `servo control` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `robotics/servo-gripper`
  - [ ] **Branching idea:** split `robotics/servo-gripper` into a main `servo gripper` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `servo gripper` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `robotics/servo-radar`
  - [ ] **Branching idea:** split `robotics/servo-radar` into a main `servo radar` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `servo radar` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `robotics/ultrasonic-rangefinder`
  - [ ] **Branching idea:** split `robotics/ultrasonic-rangefinder` into a main `ultrasonic rangefinder` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `ultrasonic rangefinder` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `robotics/wheel-encoders`
  - [ ] **Branching idea:** split `robotics/wheel-encoders` into a main `wheel encoders` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `wheel encoders` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.

### rocketry (10 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `welcome/run-tests` and `sysadmin/log-analysis`.

- `rocketry/firstlaunch`
  - [ ] **Branching idea:** split `rocketry/firstlaunch` into a main `firstlaunch` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `firstlaunch` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `rocketry/fuel-mixture`
  - [ ] **Branching idea:** split `rocketry/fuel-mixture` into a main `fuel mixture` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `fuel mixture` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `rocketry/guided-rocket-build`
  - [ ] **Branching idea:** split `rocketry/guided-rocket-build` into a main `guided rocket build` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `guided rocket build` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `rocketry/night-launch`
  - [ ] **Branching idea:** split `rocketry/night-launch` into a main `night launch` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `night launch` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `rocketry/parachute`
  - [ ] **Branching idea:** split `rocketry/parachute` into a main `parachute` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `parachute` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `rocketry/preflight-check`
  - [ ] **Branching idea:** split `rocketry/preflight-check` into a main `preflight check` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `preflight check` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `rocketry/recovery-run`
  - [ ] **Branching idea:** split `rocketry/recovery-run` into a main `recovery run` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `recovery run` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `rocketry/static-test`
  - [ ] **Branching idea:** split `rocketry/static-test` into a main `static test` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `static test` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `rocketry/suborbital-hop`
  - [ ] **Branching idea:** split `rocketry/suborbital-hop` into a main `suborbital hop` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `suborbital hop` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `rocketry/wind-check`
  - [ ] **Branching idea:** split `rocketry/wind-check` into a main `wind check` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (log entry or parsed reading) and a follow-up interpretation node before `finish`.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `wind check` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.

### ubi (3 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `ubi/basicincome` and `welcome/howtodoquests`.

- `ubi/first-payment`
  - [ ] **Branching idea:** split `ubi/first-payment` into a main `first payment` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `first payment` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `ubi/reminder`
  - [ ] **Branching idea:** split `ubi/reminder` into a main `reminder` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `reminder` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
- `ubi/savings-goal`
  - [ ] **Branching idea:** split `ubi/savings-goal` into a main `savings goal` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `savings goal` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.

### woodworking (10 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `composting/start` and `welcome/howtodoquests`.

- `woodworking/apply-finish`
  - [ ] **Branching idea:** split `woodworking/apply-finish` into a main `apply finish` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `apply finish` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `woodworking/birdhouse`
  - [ ] **Branching idea:** split `woodworking/birdhouse` into a main `birdhouse` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require two staged artifacts (setup proof, then outcome proof) so completion cannot skip the intermediate mechanic.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `birdhouse` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `woodworking/bookshelf`
  - [ ] **Branching idea:** split `woodworking/bookshelf` into a main `bookshelf` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `bookshelf` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `woodworking/coffee-table`
  - [ ] **Branching idea:** split `woodworking/coffee-table` into a main `coffee table` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `coffee table` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `woodworking/finish-sanding`
  - [ ] **Branching idea:** split `woodworking/finish-sanding` into a main `finish sanding` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `finish sanding` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `woodworking/picture-frame`
  - [ ] **Branching idea:** split `woodworking/picture-frame` into a main `picture frame` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `picture frame` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `woodworking/planter-box`
  - [ ] **Branching idea:** split `woodworking/planter-box` into a main `planter box` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `planter box` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `woodworking/step-stool`
  - [ ] **Branching idea:** split `woodworking/step-stool` into a main `step stool` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `step stool` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `woodworking/tool-rack`
  - [ ] **Branching idea:** split `woodworking/tool-rack` into a main `tool rack` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `tool rack` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.
- `woodworking/workbench`
  - [ ] **Branching idea:** split `woodworking/workbench` into a main `workbench` path plus at least one alternate branch for a realistic player choice (speed vs reliability, or low-resource fallback).
  - [ ] **Mechanics-backed evidence gate:** require at least one mechanics-backed artifact (`process` output, required item, or telemetry log) tied directly to quest completion.
  - [ ] **Troubleshooting/recovery:** add a failure branch for `workbench` (bad reading, missing part, or incorrect sequence) with explicit retry/rollback steps and a clear re-entry point.
  - [ ] **Safety note:** include a concrete safety checkpoint (hazard callout + abort condition) before irreversible steps unlock.

## Documentation improvements needed for quest authoring

These improvements are meant for what humans/agents read right after `AGENTS.md` references prompt
docs.

### A) Add a “quality bar” section to quest prompts

Add hard requirements beyond schema validity:

- Minimum interaction depth expectation (or explicit rationale for short quests).
- At least one troubleshooting/recovery branch for technical quests.
- At least one mechanics-backed evidence gate (not only prose confirmation).
- Domain-specific safety/realism checks when applicable.

### B) Add anti-pattern lint guidance for prompt users

Authoring docs should explicitly call out and forbid common shallow patterns:

- “Three-node thin shell” quests unless intentionally marked as micro-quests.
- Pure accumulation ladders without strategic decisions.
- Hardening score inflation not backed by substantive quest revisions.

### C) Add a pre-commit self-review checklist for humans + LLMs

Before committing a quest update, require a short self-audit:

- What the player learns.
- What the player proves in mechanics.
- What can go wrong and how the quest handles it.
- Why reward and prerequisites are proportionate.

### D) Encourage pair updates for docs + quest changes

Quest updates should include companion updates to the tree’s Skills docs in
`frontend/src/pages/docs/md/<tree>.md`, documenting gate logic and QA notes.

## Definition of done for v3 quest quality hardening

- [ ] The prioritized problematic quest list above has owners and tracking issues.
- [ ] Quest prompt docs include anti-pattern guidance and a self-review checklist.
- [ ] QA checklist §4.5 checkboxes are updated as manual validation progresses.
- [ ] At least one representative quest in each major new tree is manually validated before release.
