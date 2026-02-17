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

Checklist rubric used below (deterministic by quest ID keyword; first match wins):

- `install/setup/deploy/enable` → install→verify→rollback flow; gate on a post-change validation artifact (status readout/log/process output); include lockout/rollback safety notes where relevant.
- `check/test/measure/voltage/pressure/temp/ph/ec` → require recorded measurement artifact + interpretation node; add out-of-range branch and retry cadence.
- `calibrate/leveling/tension/retraction` → baseline→adjust→retest loop with tolerances; add drift re-check branch.
- `log/monitor/maintenance` → define acceptance criteria; require persistent log artifact; add anomaly branch with escalation.
- `clean/rinse/prime/scrub/purge/flush/soak` → before/after condition checks; contamination/failure branch; explicit re-entry checkpoint.
- `lettuce/stevia/breeding/regrow/cutting` (growth/lifecycle) → staged proof (setup then outcome), contingency branch, pacing/time-gate note.
- `observe/eclipse/meteor/rings` (astronomy observation) → seeing-conditions fallback, observation artifact + interpretation, weather/light-pollution troubleshooting.
- default build/fabrication flow → branch between quick prototype and durable path; require mechanics-backed completion artifact; include failure rework loop.

### 3dprinting (15 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `3dprinting/start`.

- `3dprinting/bed-leveling`
  - [ ] **Branching idea:** structure `3dprinting/bed-leveling` as baseline→adjust→retest, with separate outcomes for `within tolerance` and `still drifting`.
  - [ ] **Mechanics-backed evidence gate:** gate completion on both baseline and post-adjustment artifacts sourced from process output or logged values.
  - [ ] **Troubleshooting/recovery:** include a drift re-check branch that rolls back to last-known-good settings when tolerance fails.
- `3dprinting/benchy_10`
  - [ ] **Branching idea:** split `3dprinting/benchy_10` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `benchy 10` with explicit rollback-material checks before retry.
- `3dprinting/benchy_100`
  - [ ] **Branching idea:** split `3dprinting/benchy_100` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `benchy 100` with explicit rollback-material checks before retry.
- `3dprinting/benchy_25`
  - [ ] **Branching idea:** split `3dprinting/benchy_25` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `benchy 25` with explicit rollback-material checks before retry.
- `3dprinting/blob-of-death`
  - [ ] **Branching idea:** split `3dprinting/blob-of-death` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `blob of death` with explicit rollback-material checks before retry.
- `3dprinting/cable-clip`
  - [ ] **Branching idea:** split `3dprinting/cable-clip` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `cable clip` with explicit rollback-material checks before retry.
- `3dprinting/calibration-cube`
  - [ ] **Branching idea:** split `3dprinting/calibration-cube` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `calibration cube` with explicit rollback-material checks before retry.
- `3dprinting/filament-change`
  - [ ] **Branching idea:** split `3dprinting/filament-change` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `filament change` with explicit rollback-material checks before retry.
- `3dprinting/nozzle-cleaning`
  - [ ] **Branching idea:** split `3dprinting/nozzle-cleaning` into inspect-before, cleanup action, and inspect-after, with a contamination-still-present branch.
  - [ ] **Mechanics-backed evidence gate:** require before/after condition artifacts (maintenance log item, process output, or state-check item) to prove state change.
  - [ ] **Troubleshooting/recovery:** add a re-entry checkpoint that loops through rinse/purge retries when failure indicators persist.
- `3dprinting/nozzle-clog`
  - [ ] **Branching idea:** for `3dprinting/nozzle-clog`, split between `normal trend` and `anomaly detected` so anomaly handling is first-class.
  - [ ] **Mechanics-backed evidence gate:** require a persistent log artifact with explicit acceptance thresholds and an interpretation node.
  - [ ] **Troubleshooting/recovery:** add escalation + rollback handoff steps when logged values violate thresholds.
- `3dprinting/phone-stand`
  - [ ] **Branching idea:** make `3dprinting/phone-stand` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `3dprinting/retraction-test`
  - [ ] **Branching idea:** make `3dprinting/retraction-test` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `3dprinting/spool-holder`
  - [ ] **Branching idea:** split `3dprinting/spool-holder` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `spool holder` with explicit rollback-material checks before retry.
- `3dprinting/temperature-tower`
  - [ ] **Branching idea:** make `3dprinting/temperature-tower` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `3dprinting/x-belt-tension`
  - [ ] **Branching idea:** structure `3dprinting/x-belt-tension` as baseline→adjust→retest, with separate outcomes for `within tolerance` and `still drifting`.
  - [ ] **Mechanics-backed evidence gate:** gate completion on both baseline and post-adjustment artifacts sourced from process output or logged values.
  - [ ] **Troubleshooting/recovery:** include a drift re-check branch that rolls back to last-known-good settings when tolerance fails.

### aquaria (19 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `hydroponics/nutrient-check`, `hydroponics/basil` (fallback: no checked aquaria quests in §4.5, so use adjacent water-care growth exemplars).

- `aquaria/aquarium-light`
  - [ ] **Branching idea:** split `aquaria/aquarium-light` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `aquarium light` with explicit rollback-material checks before retry.
- `aquaria/balance-ph`
  - [ ] **Branching idea:** make `aquaria/balance-ph` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `aquaria/breeding`
  - [ ] **Branching idea:** stage `aquaria/breeding` into setup and outcome phases, with an alternate branch for stalled lifecycle progress.
  - [ ] **Mechanics-backed evidence gate:** require staged proof artifacts (setup gate first, then outcome evidence item/log) so time-based progression cannot be skipped.
  - [ ] **Troubleshooting/recovery:** add contingency actions (adjust inputs, wait interval, re-check milestone) with explicit pacing/time-gate notes.
- `aquaria/filter-rinse`
  - [ ] **Branching idea:** split `aquaria/filter-rinse` into inspect-before, cleanup action, and inspect-after, with a contamination-still-present branch.
  - [ ] **Mechanics-backed evidence gate:** require before/after condition artifacts (maintenance log item, process output, or state-check item) to prove state change.
  - [ ] **Troubleshooting/recovery:** add a re-entry checkpoint that loops through rinse/purge retries when failure indicators persist.
- `aquaria/floating-plants`
  - [ ] **Branching idea:** split `aquaria/floating-plants` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `floating plants` with explicit rollback-material checks before retry.
- `aquaria/goldfish`
  - [ ] **Branching idea:** split `aquaria/goldfish` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `goldfish` with explicit rollback-material checks before retry.
- `aquaria/guppy`
  - [ ] **Branching idea:** split `aquaria/guppy` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `guppy` with explicit rollback-material checks before retry.
- `aquaria/heater-install`
  - [ ] **Branching idea:** split `aquaria/heater-install` into install and verification paths, with a rollback branch when post-change checks fail.
  - [ ] **Mechanics-backed evidence gate:** require a post-change validation artifact (status item, process output, or parseable log) before `finish` unlocks.
  - [ ] **Troubleshooting/recovery:** add lockout-safe rollback steps for `heater install`, then force a confirmatory re-test before re-entry.
- `aquaria/log-water-parameters`
  - [ ] **Branching idea:** for `aquaria/log-water-parameters`, split between `normal trend` and `anomaly detected` so anomaly handling is first-class.
  - [ ] **Mechanics-backed evidence gate:** require a persistent log artifact with explicit acceptance thresholds and an interpretation node.
  - [ ] **Troubleshooting/recovery:** add escalation + rollback handoff steps when logged values violate thresholds.
- `aquaria/net-fish`
  - [ ] **Branching idea:** split `aquaria/net-fish` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `net fish` with explicit rollback-material checks before retry.
- `aquaria/ph-strip-test`
  - [ ] **Branching idea:** make `aquaria/ph-strip-test` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `aquaria/position-tank`
  - [ ] **Branching idea:** split `aquaria/position-tank` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `position tank` with explicit rollback-material checks before retry.
- `aquaria/shrimp`
  - [ ] **Branching idea:** split `aquaria/shrimp` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `shrimp` with explicit rollback-material checks before retry.
- `aquaria/sponge-filter`
  - [ ] **Branching idea:** split `aquaria/sponge-filter` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `sponge filter` with explicit rollback-material checks before retry.
- `aquaria/thermometer`
  - [ ] **Branching idea:** split `aquaria/thermometer` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `thermometer` with explicit rollback-material checks before retry.
- `aquaria/top-off`
  - [ ] **Branching idea:** split `aquaria/top-off` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `top off` with explicit rollback-material checks before retry.
- `aquaria/walstad`
  - [ ] **Branching idea:** split `aquaria/walstad` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `walstad` with explicit rollback-material checks before retry.
- `aquaria/water-change`
  - [ ] **Branching idea:** split `aquaria/water-change` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `water change` with explicit rollback-material checks before retry.
- `aquaria/water-testing`
  - [ ] **Branching idea:** make `aquaria/water-testing` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.

### astronomy (21 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `welcome/run-tests`, `sysadmin/log-analysis` (fallback: no checked astronomy quests in §4.5, so use observation-log workflow exemplars).

- `astronomy/andromeda`
  - [ ] **Branching idea:** split `astronomy/andromeda` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `andromeda` with explicit rollback-material checks before retry.
- `astronomy/aurora-watch`
  - [ ] **Branching idea:** split `astronomy/aurora-watch` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `aurora watch` with explicit rollback-material checks before retry.
- `astronomy/basic-telescope`
  - [ ] **Branching idea:** split `astronomy/basic-telescope` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `basic telescope` with explicit rollback-material checks before retry.
- `astronomy/binary-star`
  - [ ] **Branching idea:** split `astronomy/binary-star` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `binary star` with explicit rollback-material checks before retry.
- `astronomy/comet-tracking`
  - [ ] **Branching idea:** split `astronomy/comet-tracking` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `comet tracking` with explicit rollback-material checks before retry.
- `astronomy/constellations`
  - [ ] **Branching idea:** split `astronomy/constellations` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `constellations` with explicit rollback-material checks before retry.
- `astronomy/iss-flyover`
  - [ ] **Branching idea:** split `astronomy/iss-flyover` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `iss flyover` with explicit rollback-material checks before retry.
- `astronomy/iss-photo`
  - [ ] **Branching idea:** make `astronomy/iss-photo` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `astronomy/jupiter-moons`
  - [ ] **Branching idea:** split `astronomy/jupiter-moons` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `jupiter moons` with explicit rollback-material checks before retry.
- `astronomy/light-pollution`
  - [ ] **Branching idea:** split `astronomy/light-pollution` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `light pollution` with explicit rollback-material checks before retry.
- `astronomy/lunar-eclipse`
  - [ ] **Branching idea:** split `astronomy/lunar-eclipse` into clear-sky observation vs fallback scheduling when seeing conditions fail.
  - [ ] **Mechanics-backed evidence gate:** require an observation artifact (log/sketch/photo item or telemetry export) plus interpretation before completion.
  - [ ] **Troubleshooting/recovery:** add weather/light-pollution troubleshooting nodes and a retry window for the next viable session.
- `astronomy/meteor-shower`
  - [ ] **Branching idea:** split `astronomy/meteor-shower` into clear-sky observation vs fallback scheduling when seeing conditions fail.
  - [ ] **Mechanics-backed evidence gate:** require an observation artifact (log/sketch/photo item or telemetry export) plus interpretation before completion.
  - [ ] **Troubleshooting/recovery:** add weather/light-pollution troubleshooting nodes and a retry window for the next viable session.
- `astronomy/north-star`
  - [ ] **Branching idea:** split `astronomy/north-star` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `north star` with explicit rollback-material checks before retry.
- `astronomy/observe-moon`
  - [ ] **Branching idea:** split `astronomy/observe-moon` into clear-sky observation vs fallback scheduling when seeing conditions fail.
  - [ ] **Mechanics-backed evidence gate:** require an observation artifact (log/sketch/photo item or telemetry export) plus interpretation before completion.
  - [ ] **Troubleshooting/recovery:** add weather/light-pollution troubleshooting nodes and a retry window for the next viable session.
- `astronomy/orion-nebula`
  - [ ] **Branching idea:** split `astronomy/orion-nebula` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `orion nebula` with explicit rollback-material checks before retry.
- `astronomy/planetary-alignment`
  - [ ] **Branching idea:** split `astronomy/planetary-alignment` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `planetary alignment` with explicit rollback-material checks before retry.
- `astronomy/satellite-pass`
  - [ ] **Branching idea:** split `astronomy/satellite-pass` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `satellite pass` with explicit rollback-material checks before retry.
- `astronomy/saturn-rings`
  - [ ] **Branching idea:** split `astronomy/saturn-rings` into clear-sky observation vs fallback scheduling when seeing conditions fail.
  - [ ] **Mechanics-backed evidence gate:** require an observation artifact (log/sketch/photo item or telemetry export) plus interpretation before completion.
  - [ ] **Troubleshooting/recovery:** add weather/light-pollution troubleshooting nodes and a retry window for the next viable session.
- `astronomy/star-trails`
  - [ ] **Branching idea:** split `astronomy/star-trails` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `star trails` with explicit rollback-material checks before retry.
- `astronomy/sunspot-sketch`
  - [ ] **Branching idea:** split `astronomy/sunspot-sketch` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `sunspot sketch` with explicit rollback-material checks before retry.
- `astronomy/venus-phases`
  - [ ] **Branching idea:** make `astronomy/venus-phases` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.

### chemistry (10 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `hydroponics/nutrient-check`, `composting/check-temperature` (fallback: no checked chemistry quests in §4.5, so use adjacent measurement-and-interpretation exemplars).

- `chemistry/acid-dilution`
  - [ ] **Branching idea:** split `chemistry/acid-dilution` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `acid dilution` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `chemistry/acid-neutralization`
  - [ ] **Branching idea:** split `chemistry/acid-neutralization` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `acid neutralization` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `chemistry/buffer-solution`
  - [ ] **Branching idea:** split `chemistry/buffer-solution` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `buffer solution` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `chemistry/ph-adjustment`
  - [ ] **Branching idea:** make `chemistry/ph-adjustment` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `chemistry/ph-test`
  - [ ] **Branching idea:** make `chemistry/ph-test` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `chemistry/precipitation-reaction`
  - [ ] **Branching idea:** make `chemistry/precipitation-reaction` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `chemistry/safe-reaction`
  - [ ] **Branching idea:** split `chemistry/safe-reaction` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `safe reaction` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `chemistry/stevia-crystals`
  - [ ] **Branching idea:** stage `chemistry/stevia-crystals` into setup and outcome phases, with an alternate branch for stalled lifecycle progress.
  - [ ] **Mechanics-backed evidence gate:** require staged proof artifacts (setup gate first, then outcome evidence item/log) so time-based progression cannot be skipped.
  - [ ] **Troubleshooting/recovery:** add contingency actions (adjust inputs, wait interval, re-check milestone) with explicit pacing/time-gate notes.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `chemistry/stevia-extraction`
  - [ ] **Branching idea:** stage `chemistry/stevia-extraction` into setup and outcome phases, with an alternate branch for stalled lifecycle progress.
  - [ ] **Mechanics-backed evidence gate:** require staged proof artifacts (setup gate first, then outcome evidence item/log) so time-based progression cannot be skipped.
  - [ ] **Troubleshooting/recovery:** add contingency actions (adjust inputs, wait interval, re-check milestone) with explicit pacing/time-gate notes.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `chemistry/stevia-tasting`
  - [ ] **Branching idea:** stage `chemistry/stevia-tasting` into setup and outcome phases, with an alternate branch for stalled lifecycle progress.
  - [ ] **Mechanics-backed evidence gate:** require staged proof artifacts (setup gate first, then outcome evidence item/log) so time-based progression cannot be skipped.
  - [ ] **Troubleshooting/recovery:** add contingency actions (adjust inputs, wait interval, re-check milestone) with explicit pacing/time-gate notes.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.

### completionist (5 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `welcome/howtodoquests`, `welcome/intro-inventory` (fallback: no checked completionist quests in §4.5, so use onboarding progression exemplars).

- `completionist/catalog`
  - [ ] **Branching idea:** for `completionist/catalog`, split between `normal trend` and `anomaly detected` so anomaly handling is first-class.
  - [ ] **Mechanics-backed evidence gate:** require a persistent log artifact with explicit acceptance thresholds and an interpretation node.
  - [ ] **Troubleshooting/recovery:** add escalation + rollback handoff steps when logged values violate thresholds.
- `completionist/display`
  - [ ] **Branching idea:** split `completionist/display` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `display` with explicit rollback-material checks before retry.
- `completionist/polish`
  - [ ] **Branching idea:** split `completionist/polish` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `polish` with explicit rollback-material checks before retry.
- `completionist/reminder`
  - [ ] **Branching idea:** split `completionist/reminder` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `reminder` with explicit rollback-material checks before retry.
- `completionist/v2`
  - [ ] **Branching idea:** split `completionist/v2` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `v2` with explicit rollback-material checks before retry.

### devops (15 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `sysadmin/basic-commands`, `sysadmin/resource-monitoring` (fallback: no checked devops quests in §4.5, so use operational runbook exemplars).

- `devops/auto-updates`
  - [ ] **Branching idea:** split `devops/auto-updates` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `auto updates` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `devops/ci-pipeline`
  - [ ] **Branching idea:** split `devops/ci-pipeline` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `ci pipeline` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `devops/daily-backups`
  - [ ] **Branching idea:** split `devops/daily-backups` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `daily backups` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `devops/docker-compose`
  - [ ] **Branching idea:** split `devops/docker-compose` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `docker compose` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `devops/enable-https`
  - [ ] **Branching idea:** split `devops/enable-https` into install and verification paths, with a rollback branch when post-change checks fail.
  - [ ] **Mechanics-backed evidence gate:** require a post-change validation artifact (status item, process output, or parseable log) before `finish` unlocks.
  - [ ] **Troubleshooting/recovery:** add lockout-safe rollback steps for `enable https`, then force a confirmatory re-test before re-entry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `devops/fail2ban`
  - [ ] **Branching idea:** split `devops/fail2ban` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `fail2ban` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `devops/firewall-rules`
  - [ ] **Branching idea:** split `devops/firewall-rules` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `firewall rules` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `devops/k3s-deploy`
  - [ ] **Branching idea:** split `devops/k3s-deploy` into install and verification paths, with a rollback branch when post-change checks fail.
  - [ ] **Mechanics-backed evidence gate:** require a post-change validation artifact (status item, process output, or parseable log) before `finish` unlocks.
  - [ ] **Troubleshooting/recovery:** add lockout-safe rollback steps for `k3s deploy`, then force a confirmatory re-test before re-entry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `devops/log-maintenance`
  - [ ] **Branching idea:** for `devops/log-maintenance`, split between `normal trend` and `anomaly detected` so anomaly handling is first-class.
  - [ ] **Mechanics-backed evidence gate:** require a persistent log artifact with explicit acceptance thresholds and an interpretation node.
  - [ ] **Troubleshooting/recovery:** add escalation + rollback handoff steps when logged values violate thresholds.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `devops/monitoring`
  - [ ] **Branching idea:** for `devops/monitoring`, split between `normal trend` and `anomaly detected` so anomaly handling is first-class.
  - [ ] **Mechanics-backed evidence gate:** require a persistent log artifact with explicit acceptance thresholds and an interpretation node.
  - [ ] **Troubleshooting/recovery:** add escalation + rollback handoff steps when logged values violate thresholds.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `devops/pi-cluster-hardware`
  - [ ] **Branching idea:** split `devops/pi-cluster-hardware` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `pi cluster hardware` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `devops/prepare-first-node`
  - [ ] **Branching idea:** split `devops/prepare-first-node` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `prepare first node` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `devops/private-registry`
  - [ ] **Branching idea:** split `devops/private-registry` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `private registry` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `devops/ssd-boot`
  - [ ] **Branching idea:** split `devops/ssd-boot` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `ssd boot` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `devops/ssh-hardening`
  - [ ] **Branching idea:** split `devops/ssh-hardening` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `ssh hardening` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.

### electronics (22 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `welcome/smart-plug-test`, `sysadmin/basic-commands` (fallback: no checked electronics quests in §4.5, so use device-check + command-runbook exemplars).

- `electronics/arduino-blink`
  - [ ] **Branching idea:** split `electronics/arduino-blink` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `arduino blink` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `electronics/basic-circuit`
  - [ ] **Branching idea:** split `electronics/basic-circuit` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `basic circuit` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `electronics/check-battery-voltage`
  - [ ] **Branching idea:** make `electronics/check-battery-voltage` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `electronics/continuity-test`
  - [ ] **Branching idea:** make `electronics/continuity-test` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `electronics/data-logger`
  - [ ] **Branching idea:** for `electronics/data-logger`, split between `normal trend` and `anomaly detected` so anomaly handling is first-class.
  - [ ] **Mechanics-backed evidence gate:** require a persistent log artifact with explicit acceptance thresholds and an interpretation node.
  - [ ] **Troubleshooting/recovery:** add escalation + rollback handoff steps when logged values violate thresholds.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `electronics/desolder-component`
  - [ ] **Branching idea:** split `electronics/desolder-component` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `desolder component` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `electronics/led-polarity`
  - [ ] **Branching idea:** split `electronics/led-polarity` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `led polarity` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `electronics/light-sensor`
  - [ ] **Branching idea:** split `electronics/light-sensor` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `light sensor` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `electronics/measure-arduino-5v`
  - [ ] **Branching idea:** make `electronics/measure-arduino-5v` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `electronics/measure-led-current`
  - [ ] **Branching idea:** make `electronics/measure-led-current` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `electronics/measure-resistance`
  - [ ] **Branching idea:** make `electronics/measure-resistance` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `electronics/potentiometer-dimmer`
  - [ ] **Branching idea:** split `electronics/potentiometer-dimmer` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `potentiometer dimmer` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `electronics/resistor-color-check`
  - [ ] **Branching idea:** make `electronics/resistor-color-check` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `electronics/servo-sweep`
  - [ ] **Branching idea:** split `electronics/servo-sweep` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `servo sweep` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `electronics/solder-led-harness`
  - [ ] **Branching idea:** split `electronics/solder-led-harness` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `solder led harness` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `electronics/solder-wire`
  - [ ] **Branching idea:** split `electronics/solder-wire` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `solder wire` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `electronics/soldering-intro`
  - [ ] **Branching idea:** split `electronics/soldering-intro` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `soldering intro` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `electronics/temperature-plot`
  - [ ] **Branching idea:** make `electronics/temperature-plot` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `electronics/test-gfci-outlet`
  - [ ] **Branching idea:** make `electronics/test-gfci-outlet` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `electronics/thermistor-reading`
  - [ ] **Branching idea:** split `electronics/thermistor-reading` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `thermistor reading` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `electronics/thermometer-calibration`
  - [ ] **Branching idea:** split `electronics/thermometer-calibration` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `thermometer calibration` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `electronics/voltage-divider`
  - [ ] **Branching idea:** make `electronics/voltage-divider` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.

### energy (11 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `welcome/smart-plug-test`, `hydroponics/nutrient-check` (fallback: no checked energy quests in §4.5, so use device telemetry + threshold exemplars).

- `energy/battery-maintenance`
  - [ ] **Branching idea:** for `energy/battery-maintenance`, split between `normal trend` and `anomaly detected` so anomaly handling is first-class.
  - [ ] **Mechanics-backed evidence gate:** require a persistent log artifact with explicit acceptance thresholds and an interpretation node.
  - [ ] **Troubleshooting/recovery:** add escalation + rollback handoff steps when logged values violate thresholds.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `energy/battery-upgrade`
  - [ ] **Branching idea:** split `energy/battery-upgrade` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `battery upgrade` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `energy/biogas-digester`
  - [ ] **Branching idea:** split `energy/biogas-digester` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `biogas digester` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `energy/charge-controller-setup`
  - [ ] **Branching idea:** split `energy/charge-controller-setup` into install and verification paths, with a rollback branch when post-change checks fail.
  - [ ] **Mechanics-backed evidence gate:** require a post-change validation artifact (status item, process output, or parseable log) before `finish` unlocks.
  - [ ] **Troubleshooting/recovery:** add lockout-safe rollback steps for `charge controller setup`, then force a confirmatory re-test before re-entry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `energy/hand-crank-generator`
  - [ ] **Branching idea:** split `energy/hand-crank-generator` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `hand crank generator` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `energy/offgrid-charger`
  - [ ] **Branching idea:** split `energy/offgrid-charger` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `offgrid charger` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `energy/portable-solar-panel`
  - [ ] **Branching idea:** split `energy/portable-solar-panel` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `portable solar panel` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `energy/power-inverter`
  - [ ] **Branching idea:** split `energy/power-inverter` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `power inverter` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `energy/solar-tracker`
  - [ ] **Branching idea:** split `energy/solar-tracker` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `solar tracker` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `energy/solar`
  - [ ] **Branching idea:** split `energy/solar` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `solar` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `energy/wind-turbine`
  - [ ] **Branching idea:** split `energy/wind-turbine` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `wind turbine` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.

### firstaid (13 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `welcome/howtodoquests`, `composting/start` (fallback: no checked firstaid quests in §4.5, so use stepwise safety pacing exemplars).

- `firstaid/assemble-kit`
  - [ ] **Branching idea:** split `firstaid/assemble-kit` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `assemble kit` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `firstaid/change-bandage`
  - [ ] **Branching idea:** split `firstaid/change-bandage` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `change bandage` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `firstaid/dispose-bandages`
  - [ ] **Branching idea:** split `firstaid/dispose-bandages` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `dispose bandages` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `firstaid/dispose-expired`
  - [ ] **Branching idea:** split `firstaid/dispose-expired` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `dispose expired` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `firstaid/flashlight-battery`
  - [ ] **Branching idea:** split `firstaid/flashlight-battery` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `flashlight battery` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `firstaid/learn-cpr`
  - [ ] **Branching idea:** split `firstaid/learn-cpr` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `learn cpr` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `firstaid/remove-splinter`
  - [ ] **Branching idea:** split `firstaid/remove-splinter` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `remove splinter` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `firstaid/restock-kit`
  - [ ] **Branching idea:** split `firstaid/restock-kit` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `restock kit` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `firstaid/sanitize-pocket-mask`
  - [ ] **Branching idea:** split `firstaid/sanitize-pocket-mask` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `sanitize pocket mask` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `firstaid/splint-limb`
  - [ ] **Branching idea:** split `firstaid/splint-limb` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `splint limb` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `firstaid/stop-nosebleed`
  - [ ] **Branching idea:** split `firstaid/stop-nosebleed` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `stop nosebleed` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `firstaid/treat-burn`
  - [ ] **Branching idea:** split `firstaid/treat-burn` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `treat burn` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `firstaid/wound-care`
  - [ ] **Branching idea:** split `firstaid/wound-care` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `wound care` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.

### geothermal (15 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `hydroponics/nutrient-check`, `sysadmin/resource-monitoring` (fallback: no checked geothermal quests in §4.5, so use sensor telemetry + monitoring exemplars).

- `geothermal/backflush-loop-filter`
  - [ ] **Branching idea:** split `geothermal/backflush-loop-filter` into inspect-before, cleanup action, and inspect-after, with a contamination-still-present branch.
  - [ ] **Mechanics-backed evidence gate:** require before/after condition artifacts (maintenance log item, process output, or state-check item) to prove state change.
  - [ ] **Troubleshooting/recovery:** add a re-entry checkpoint that loops through rinse/purge retries when failure indicators persist.
- `geothermal/calibrate-ground-sensor`
  - [ ] **Branching idea:** structure `geothermal/calibrate-ground-sensor` as baseline→adjust→retest, with separate outcomes for `within tolerance` and `still drifting`.
  - [ ] **Mechanics-backed evidence gate:** gate completion on both baseline and post-adjustment artifacts sourced from process output or logged values.
  - [ ] **Troubleshooting/recovery:** include a drift re-check branch that rolls back to last-known-good settings when tolerance fails.
- `geothermal/check-loop-inlet-temp`
  - [ ] **Branching idea:** make `geothermal/check-loop-inlet-temp` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `geothermal/check-loop-outlet-temp`
  - [ ] **Branching idea:** make `geothermal/check-loop-outlet-temp` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `geothermal/check-loop-pressure`
  - [ ] **Branching idea:** make `geothermal/check-loop-pressure` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `geothermal/check-loop-temp-delta`
  - [ ] **Branching idea:** make `geothermal/check-loop-temp-delta` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `geothermal/compare-depth-ground-temps`
  - [ ] **Branching idea:** make `geothermal/compare-depth-ground-temps` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `geothermal/compare-seasonal-ground-temps`
  - [ ] **Branching idea:** make `geothermal/compare-seasonal-ground-temps` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `geothermal/install-backup-thermistor`
  - [ ] **Branching idea:** split `geothermal/install-backup-thermistor` into install and verification paths, with a rollback branch when post-change checks fail.
  - [ ] **Mechanics-backed evidence gate:** require a post-change validation artifact (status item, process output, or parseable log) before `finish` unlocks.
  - [ ] **Troubleshooting/recovery:** add lockout-safe rollback steps for `install backup thermistor`, then force a confirmatory re-test before re-entry.
- `geothermal/log-ground-temperature`
  - [ ] **Branching idea:** make `geothermal/log-ground-temperature` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `geothermal/log-heat-pump-warmup`
  - [ ] **Branching idea:** for `geothermal/log-heat-pump-warmup`, split between `normal trend` and `anomaly detected` so anomaly handling is first-class.
  - [ ] **Mechanics-backed evidence gate:** require a persistent log artifact with explicit acceptance thresholds and an interpretation node.
  - [ ] **Troubleshooting/recovery:** add escalation + rollback handoff steps when logged values violate thresholds.
- `geothermal/monitor-heat-pump-energy`
  - [ ] **Branching idea:** for `geothermal/monitor-heat-pump-energy`, split between `normal trend` and `anomaly detected` so anomaly handling is first-class.
  - [ ] **Mechanics-backed evidence gate:** require a persistent log artifact with explicit acceptance thresholds and an interpretation node.
  - [ ] **Troubleshooting/recovery:** add escalation + rollback handoff steps when logged values violate thresholds.
- `geothermal/purge-loop-air`
  - [ ] **Branching idea:** split `geothermal/purge-loop-air` into inspect-before, cleanup action, and inspect-after, with a contamination-still-present branch.
  - [ ] **Mechanics-backed evidence gate:** require before/after condition artifacts (maintenance log item, process output, or state-check item) to prove state change.
  - [ ] **Troubleshooting/recovery:** add a re-entry checkpoint that loops through rinse/purge retries when failure indicators persist.
- `geothermal/replace-faulty-thermistor`
  - [ ] **Branching idea:** split `geothermal/replace-faulty-thermistor` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `replace faulty thermistor` with explicit rollback-material checks before retry.
- `geothermal/survey-ground-temperature`
  - [ ] **Branching idea:** make `geothermal/survey-ground-temperature` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.

### hydroponics (21 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `hydroponics/basil`, `hydroponics/nutrient-check`.

- `hydroponics/air-stone-soak`
  - [ ] **Branching idea:** split `hydroponics/air-stone-soak` into inspect-before, cleanup action, and inspect-after, with a contamination-still-present branch.
  - [ ] **Mechanics-backed evidence gate:** require before/after condition artifacts (maintenance log item, process output, or state-check item) to prove state change.
  - [ ] **Troubleshooting/recovery:** add a re-entry checkpoint that loops through rinse/purge retries when failure indicators persist.
- `hydroponics/bucket_10`
  - [ ] **Branching idea:** split `hydroponics/bucket_10` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `bucket 10` with explicit rollback-material checks before retry.
- `hydroponics/ec-calibrate`
  - [ ] **Branching idea:** make `hydroponics/ec-calibrate` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `hydroponics/ec-check`
  - [ ] **Branching idea:** make `hydroponics/ec-check` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `hydroponics/filter-clean`
  - [ ] **Branching idea:** split `hydroponics/filter-clean` into inspect-before, cleanup action, and inspect-after, with a contamination-still-present branch.
  - [ ] **Mechanics-backed evidence gate:** require before/after condition artifacts (maintenance log item, process output, or state-check item) to prove state change.
  - [ ] **Troubleshooting/recovery:** add a re-entry checkpoint that loops through rinse/purge retries when failure indicators persist.
- `hydroponics/grow-light`
  - [ ] **Branching idea:** split `hydroponics/grow-light` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `grow light` with explicit rollback-material checks before retry.
- `hydroponics/lettuce`
  - [ ] **Branching idea:** stage `hydroponics/lettuce` into setup and outcome phases, with an alternate branch for stalled lifecycle progress.
  - [ ] **Mechanics-backed evidence gate:** require staged proof artifacts (setup gate first, then outcome evidence item/log) so time-based progression cannot be skipped.
  - [ ] **Troubleshooting/recovery:** add contingency actions (adjust inputs, wait interval, re-check milestone) with explicit pacing/time-gate notes.
- `hydroponics/mint-cutting`
  - [ ] **Branching idea:** stage `hydroponics/mint-cutting` into setup and outcome phases, with an alternate branch for stalled lifecycle progress.
  - [ ] **Mechanics-backed evidence gate:** require staged proof artifacts (setup gate first, then outcome evidence item/log) so time-based progression cannot be skipped.
  - [ ] **Troubleshooting/recovery:** add contingency actions (adjust inputs, wait interval, re-check milestone) with explicit pacing/time-gate notes.
- `hydroponics/netcup-clean`
  - [ ] **Branching idea:** split `hydroponics/netcup-clean` into inspect-before, cleanup action, and inspect-after, with a contamination-still-present branch.
  - [ ] **Mechanics-backed evidence gate:** require before/after condition artifacts (maintenance log item, process output, or state-check item) to prove state change.
  - [ ] **Troubleshooting/recovery:** add a re-entry checkpoint that loops through rinse/purge retries when failure indicators persist.
- `hydroponics/ph-check`
  - [ ] **Branching idea:** make `hydroponics/ph-check` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `hydroponics/ph-test`
  - [ ] **Branching idea:** make `hydroponics/ph-test` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `hydroponics/plug-soak`
  - [ ] **Branching idea:** split `hydroponics/plug-soak` into inspect-before, cleanup action, and inspect-after, with a contamination-still-present branch.
  - [ ] **Mechanics-backed evidence gate:** require before/after condition artifacts (maintenance log item, process output, or state-check item) to prove state change.
  - [ ] **Troubleshooting/recovery:** add a re-entry checkpoint that loops through rinse/purge retries when failure indicators persist.
- `hydroponics/pump-install`
  - [ ] **Branching idea:** split `hydroponics/pump-install` into install and verification paths, with a rollback branch when post-change checks fail.
  - [ ] **Mechanics-backed evidence gate:** require a post-change validation artifact (status item, process output, or parseable log) before `finish` unlocks.
  - [ ] **Troubleshooting/recovery:** add lockout-safe rollback steps for `pump install`, then force a confirmatory re-test before re-entry.
- `hydroponics/pump-prime`
  - [ ] **Branching idea:** split `hydroponics/pump-prime` into inspect-before, cleanup action, and inspect-after, with a contamination-still-present branch.
  - [ ] **Mechanics-backed evidence gate:** require before/after condition artifacts (maintenance log item, process output, or state-check item) to prove state change.
  - [ ] **Troubleshooting/recovery:** add a re-entry checkpoint that loops through rinse/purge retries when failure indicators persist.
- `hydroponics/regrow-stevia`
  - [ ] **Branching idea:** stage `hydroponics/regrow-stevia` into setup and outcome phases, with an alternate branch for stalled lifecycle progress.
  - [ ] **Mechanics-backed evidence gate:** require staged proof artifacts (setup gate first, then outcome evidence item/log) so time-based progression cannot be skipped.
  - [ ] **Troubleshooting/recovery:** add contingency actions (adjust inputs, wait interval, re-check milestone) with explicit pacing/time-gate notes.
- `hydroponics/reservoir-refresh`
  - [ ] **Branching idea:** split `hydroponics/reservoir-refresh` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `reservoir refresh` with explicit rollback-material checks before retry.
- `hydroponics/root-rinse`
  - [ ] **Branching idea:** split `hydroponics/root-rinse` into inspect-before, cleanup action, and inspect-after, with a contamination-still-present branch.
  - [ ] **Mechanics-backed evidence gate:** require before/after condition artifacts (maintenance log item, process output, or state-check item) to prove state change.
  - [ ] **Troubleshooting/recovery:** add a re-entry checkpoint that loops through rinse/purge retries when failure indicators persist.
- `hydroponics/stevia`
  - [ ] **Branching idea:** stage `hydroponics/stevia` into setup and outcome phases, with an alternate branch for stalled lifecycle progress.
  - [ ] **Mechanics-backed evidence gate:** require staged proof artifacts (setup gate first, then outcome evidence item/log) so time-based progression cannot be skipped.
  - [ ] **Troubleshooting/recovery:** add contingency actions (adjust inputs, wait interval, re-check milestone) with explicit pacing/time-gate notes.
- `hydroponics/temp-check`
  - [ ] **Branching idea:** make `hydroponics/temp-check` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `hydroponics/top-off`
  - [ ] **Branching idea:** split `hydroponics/top-off` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `top off` with explicit rollback-material checks before retry.
- `hydroponics/tub-scrub`
  - [ ] **Branching idea:** split `hydroponics/tub-scrub` into inspect-before, cleanup action, and inspect-after, with a contamination-still-present branch.
  - [ ] **Mechanics-backed evidence gate:** require before/after condition artifacts (maintenance log item, process output, or state-check item) to prove state change.
  - [ ] **Troubleshooting/recovery:** add a re-entry checkpoint that loops through rinse/purge retries when failure indicators persist.

### programming (18 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `sysadmin/basic-commands`, `welcome/run-tests` (fallback: no checked programming quests in §4.5, so use command/test verification exemplars).

- `programming/avg-temp`
  - [ ] **Branching idea:** make `programming/avg-temp` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `programming/graph-temp-data`
  - [ ] **Branching idea:** make `programming/graph-temp-data` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `programming/graph-temp`
  - [ ] **Branching idea:** make `programming/graph-temp` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `programming/hello-sensor`
  - [ ] **Branching idea:** split `programming/hello-sensor` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `hello sensor` with explicit rollback-material checks before retry.
- `programming/http-post`
  - [ ] **Branching idea:** split `programming/http-post` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `http post` with explicit rollback-material checks before retry.
- `programming/json-api`
  - [ ] **Branching idea:** split `programming/json-api` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `json api` with explicit rollback-material checks before retry.
- `programming/json-endpoint`
  - [ ] **Branching idea:** split `programming/json-endpoint` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `json endpoint` with explicit rollback-material checks before retry.
- `programming/median-temp`
  - [ ] **Branching idea:** make `programming/median-temp` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `programming/moving-avg-temp`
  - [ ] **Branching idea:** make `programming/moving-avg-temp` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `programming/plot-temp-cli`
  - [ ] **Branching idea:** make `programming/plot-temp-cli` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `programming/stddev-temp`
  - [ ] **Branching idea:** make `programming/stddev-temp` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `programming/temp-alert`
  - [ ] **Branching idea:** make `programming/temp-alert` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `programming/temp-email`
  - [ ] **Branching idea:** make `programming/temp-email` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `programming/temp-graph`
  - [ ] **Branching idea:** make `programming/temp-graph` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `programming/temp-json-api`
  - [ ] **Branching idea:** make `programming/temp-json-api` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `programming/temp-logger`
  - [ ] **Branching idea:** make `programming/temp-logger` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `programming/thermistor-calibration`
  - [ ] **Branching idea:** split `programming/thermistor-calibration` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `thermistor calibration` with explicit rollback-material checks before retry.
- `programming/web-server`
  - [ ] **Branching idea:** split `programming/web-server` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `web server` with explicit rollback-material checks before retry.

### robotics (13 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `sysadmin/resource-monitoring`, `welcome/smart-plug-test` (fallback: no checked robotics quests in §4.5, so use actuator-check + telemetry exemplars).

- `robotics/gyro-balance`
  - [ ] **Branching idea:** split `robotics/gyro-balance` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `gyro balance` with explicit rollback-material checks before retry.
- `robotics/line-follower`
  - [ ] **Branching idea:** split `robotics/line-follower` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `line follower` with explicit rollback-material checks before retry.
- `robotics/maze-navigation`
  - [ ] **Branching idea:** split `robotics/maze-navigation` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `maze navigation` with explicit rollback-material checks before retry.
- `robotics/obstacle-avoidance`
  - [ ] **Branching idea:** split `robotics/obstacle-avoidance` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `obstacle avoidance` with explicit rollback-material checks before retry.
- `robotics/odometry-basics`
  - [ ] **Branching idea:** split `robotics/odometry-basics` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `odometry basics` with explicit rollback-material checks before retry.
- `robotics/pan-tilt`
  - [ ] **Branching idea:** split `robotics/pan-tilt` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `pan tilt` with explicit rollback-material checks before retry.
- `robotics/reflectance-sensors`
  - [ ] **Branching idea:** make `robotics/reflectance-sensors` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
- `robotics/servo-arm`
  - [ ] **Branching idea:** split `robotics/servo-arm` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `servo arm` with explicit rollback-material checks before retry.
- `robotics/servo-control`
  - [ ] **Branching idea:** split `robotics/servo-control` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `servo control` with explicit rollback-material checks before retry.
- `robotics/servo-gripper`
  - [ ] **Branching idea:** split `robotics/servo-gripper` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `servo gripper` with explicit rollback-material checks before retry.
- `robotics/servo-radar`
  - [ ] **Branching idea:** split `robotics/servo-radar` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `servo radar` with explicit rollback-material checks before retry.
- `robotics/ultrasonic-rangefinder`
  - [ ] **Branching idea:** split `robotics/ultrasonic-rangefinder` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `ultrasonic rangefinder` with explicit rollback-material checks before retry.
- `robotics/wheel-encoders`
  - [ ] **Branching idea:** split `robotics/wheel-encoders` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `wheel encoders` with explicit rollback-material checks before retry.

### rocketry (10 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `welcome/run-tests`, `sysadmin/log-analysis` (fallback: no checked rocketry quests in §4.5, so use procedural test-log exemplars).

- `rocketry/firstlaunch`
  - [ ] **Branching idea:** split `rocketry/firstlaunch` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `firstlaunch` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `rocketry/fuel-mixture`
  - [ ] **Branching idea:** split `rocketry/fuel-mixture` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `fuel mixture` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `rocketry/guided-rocket-build`
  - [ ] **Branching idea:** split `rocketry/guided-rocket-build` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `guided rocket build` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `rocketry/night-launch`
  - [ ] **Branching idea:** split `rocketry/night-launch` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `night launch` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `rocketry/parachute`
  - [ ] **Branching idea:** split `rocketry/parachute` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `parachute` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `rocketry/preflight-check`
  - [ ] **Branching idea:** make `rocketry/preflight-check` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `rocketry/recovery-run`
  - [ ] **Branching idea:** make `rocketry/recovery-run` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `rocketry/static-test`
  - [ ] **Branching idea:** make `rocketry/static-test` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `rocketry/suborbital-hop`
  - [ ] **Branching idea:** split `rocketry/suborbital-hop` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `suborbital hop` with explicit rollback-material checks before retry.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.
- `rocketry/wind-check`
  - [ ] **Branching idea:** make `rocketry/wind-check` branch on in-range vs out-of-range readings so remediation is mandatory.
  - [ ] **Mechanics-backed evidence gate:** require a recorded measurement artifact (`requiresItems` probe/log item or telemetry process output) plus an interpretation node.
  - [ ] **Troubleshooting/recovery:** add retry cadence guidance (re-sample, compare trend, escalate threshold breaches) before completion.
  - [ ] **Safety note:** include a concrete hazard checkpoint (abort condition + safe-state rollback) before irreversible steps unlock.

### ubi (3 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `ubi/basicincome`.

- `ubi/first-payment`
  - [ ] **Branching idea:** split `ubi/first-payment` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `first payment` with explicit rollback-material checks before retry.
- `ubi/reminder`
  - [ ] **Branching idea:** split `ubi/reminder` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `reminder` with explicit rollback-material checks before retry.
- `ubi/savings-goal`
  - [ ] **Branching idea:** split `ubi/savings-goal` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `savings goal` with explicit rollback-material checks before retry.

### woodworking (10 quests)

Exemplar anchors from checked quests in `docs/qa/v3.md` §4.5: `composting/start`, `welcome/howtodoquests` (fallback: no checked woodworking quests in §4.5, so use staged craft progression exemplars).

- `woodworking/apply-finish`
  - [ ] **Branching idea:** split `woodworking/apply-finish` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `apply finish` with explicit rollback-material checks before retry.
- `woodworking/birdhouse`
  - [ ] **Branching idea:** split `woodworking/birdhouse` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `birdhouse` with explicit rollback-material checks before retry.
- `woodworking/bookshelf`
  - [ ] **Branching idea:** split `woodworking/bookshelf` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `bookshelf` with explicit rollback-material checks before retry.
- `woodworking/coffee-table`
  - [ ] **Branching idea:** split `woodworking/coffee-table` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `coffee table` with explicit rollback-material checks before retry.
- `woodworking/finish-sanding`
  - [ ] **Branching idea:** split `woodworking/finish-sanding` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `finish sanding` with explicit rollback-material checks before retry.
- `woodworking/picture-frame`
  - [ ] **Branching idea:** split `woodworking/picture-frame` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `picture frame` with explicit rollback-material checks before retry.
- `woodworking/planter-box`
  - [ ] **Branching idea:** split `woodworking/planter-box` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `planter box` with explicit rollback-material checks before retry.
- `woodworking/step-stool`
  - [ ] **Branching idea:** split `woodworking/step-stool` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `step stool` with explicit rollback-material checks before retry.
- `woodworking/tool-rack`
  - [ ] **Branching idea:** split `woodworking/tool-rack` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `tool rack` with explicit rollback-material checks before retry.
- `woodworking/workbench`
  - [ ] **Branching idea:** split `woodworking/workbench` into quick prototype and durability-focused paths with different resource tradeoffs.
  - [ ] **Mechanics-backed evidence gate:** require a completion artifact grounded in mechanics (`requiresItems`, `launchesProcess`, or resulting log item) before `finish`.
  - [ ] **Troubleshooting/recovery:** add a defect/rework branch for `workbench` with explicit rollback-material checks before retry.

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
