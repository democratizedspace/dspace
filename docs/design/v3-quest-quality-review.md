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

Checklist rubric (type-driven, applied by quest-id keywords):

- **A) install/setup** (`install`, `setup`, `deploy`, `enable`, `configure`)
  - install → verify → rollback structure
  - concrete verification artifact (status output / log snapshot / expected state)
  - rollback or lockout-avoidance handling (especially for devops/electronics/energy)
- **B) measure/test/check** (`check`, `test`, `measure`, `voltage`, `pressure`, `temp`, `ph`, `ec`)
  - recorded measurement artifact + interpretation node before `finish`
  - out-of-range branch with corrective action + re-test loop
- **C) calibrate/adjust** (`calibrate`, `leveling`, `tension`, `retraction`, `trim`)
  - baseline → adjust → re-test loop with tolerance target
  - drift/variance follow-up branch when results do not hold
- **D) log/monitor/maintenance** (`log`, `monitor`, `maintenance`)
  - explicit acceptance criteria for log/monitor output
  - anomaly branch with corrective action + follow-up verification
- **E) clean/rinse/purge/prime/scrub** (`clean`, `rinse`, `purge`, `prime`, `scrub`)
  - before/after condition check defining what “clean” means
  - contamination/failure branch with a safe re-entry point
- **F) grow/lifecycle/outcome** (`breeding`, `lettuce`, `stevia`, `basil`, `mint`, `shrimp`, `guppy`, `goldfish`, `walstad`)
  - staged proof with setup artifact **and** outcome artifact
  - contingency branch for stress/failure signs + pause/abort criteria
- **G) astronomy observation** (`observe`, `eclipse`, `meteor`, `rings`, `nebula`, `aurora`, `satellite`, `iss`)
  - seeing/weather/light-pollution fallback branch
  - observation artifact (log/sketch/photo) + interpretation node

Type matching: **FIRST keyword match wins.**

Fallback policy for exemplar anchors: if a tree has no checked quests in `docs/qa/v3.md` §4.5, use exactly two checked nearest-neighbor exemplars from measurement/logging/procedural workflows and label the line with `(fallback: no checked <tree> quests yet)`.

Include an explicit `Safety note:` bullet only for chemistry, firstaid, devops, electronics, energy, and rocketry entries where risk handling is plausible.

### 3dprinting (15 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): 3dprinting/start, welcome/run-tests

- `3dprinting/bed-leveling`
  - [ ] Structure `3dprinting/bed-leveling` as baseline → adjust → re-test with a stated tolerance target that gates completion.
  - [ ] Require evidence artifacts for both baseline and post-adjust states (reading snapshots, process output, or logged values).
  - [ ] Add a drift/variance branch: if results do not hold on follow-up, roll back to last-known-good settings and repeat the loop.
- `3dprinting/benchy_10`
  - [ ] Split `3dprinting/benchy_10` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `3dprinting/benchy_100`
  - [ ] Split `3dprinting/benchy_100` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `3dprinting/benchy_25`
  - [ ] Split `3dprinting/benchy_25` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `3dprinting/blob-of-death`
  - [ ] Split `3dprinting/blob-of-death` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `3dprinting/cable-clip`
  - [ ] Split `3dprinting/cable-clip` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `3dprinting/calibration-cube`
  - [ ] Split `3dprinting/calibration-cube` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `3dprinting/filament-change`
  - [ ] Split `3dprinting/filament-change` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `3dprinting/nozzle-cleaning`
  - [ ] Define `3dprinting/nozzle-cleaning` clean-state success using measurable before/after condition checks (residue, flow, clarity, or signal quality).
  - [ ] Gate completion on paired artifacts (pre-state + post-state) proving the state change in mechanics, not just dialogue.
  - [ ] Add a contamination/failure branch with a safe re-entry checkpoint and a loop that repeats until post-clean criteria pass.
- `3dprinting/nozzle-clog`
  - [ ] Define acceptance criteria for `3dprinting/nozzle-clog` logs/monitoring (required fields, cadence, and threshold bounds) before `finish` can unlock.
  - [ ] Add an anomaly branch that classifies abnormal output and records corrective action before returning to normal monitoring.
  - [ ] require a follow-up verification window (fresh log slice or monitor snapshot) before closure.
- `3dprinting/phone-stand`
  - [ ] Require `3dprinting/phone-stand` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `3dprinting/retraction-test`
  - [ ] Require `3dprinting/retraction-test` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `3dprinting/spool-holder`
  - [ ] Split `3dprinting/spool-holder` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `3dprinting/temperature-tower`
  - [ ] Require `3dprinting/temperature-tower` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `3dprinting/x-belt-tension`
  - [ ] Structure `3dprinting/x-belt-tension` as baseline → adjust → re-test with a stated tolerance target that gates completion.
  - [ ] Require evidence artifacts for both baseline and post-adjust states (reading snapshots, process output, or logged values).
  - [ ] Add a drift/variance branch: if results do not hold on follow-up, roll back to last-known-good settings and repeat the loop.

### aquaria (19 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): hydroponics/nutrient-check, composting/check-temperature (fallback: no checked aquaria quests yet)

- `aquaria/aquarium-light`
  - [ ] Split `aquaria/aquarium-light` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `aquaria/balance-ph`
  - [ ] Require `aquaria/balance-ph` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `aquaria/breeding`
  - [ ] Stage `aquaria/breeding` with two proofs: a setup artifact first and an outcome artifact later; require both before `finish`.
  - [ ] Add a contingency branch for stress/failure signs with concrete corrective actions and a timed re-check checkpoint.
  - [ ] Define pause/abort criteria so progression halts on worsening signals and resumes only after recovery evidence is logged.
- `aquaria/filter-rinse`
  - [ ] Define `aquaria/filter-rinse` clean-state success using measurable before/after condition checks (residue, flow, clarity, or signal quality).
  - [ ] Gate completion on paired artifacts (pre-state + post-state) proving the state change in mechanics, not just dialogue.
  - [ ] Add a contamination/failure branch with a safe re-entry checkpoint and a loop that repeats until post-clean criteria pass.
- `aquaria/floating-plants`
  - [ ] Split `aquaria/floating-plants` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `aquaria/goldfish`
  - [ ] Stage `aquaria/goldfish` with two proofs: a setup artifact first and an outcome artifact later; require both before `finish`.
  - [ ] Add a contingency branch for stress/failure signs with concrete corrective actions and a timed re-check checkpoint.
  - [ ] Define pause/abort criteria so progression halts on worsening signals and resumes only after recovery evidence is logged.
- `aquaria/guppy`
  - [ ] Stage `aquaria/guppy` with two proofs: a setup artifact first and an outcome artifact later; require both before `finish`.
  - [ ] Add a contingency branch for stress/failure signs with concrete corrective actions and a timed re-check checkpoint.
  - [ ] Define pause/abort criteria so progression halts on worsening signals and resumes only after recovery evidence is logged.
- `aquaria/heater-install`
  - [ ] Rewrite `aquaria/heater-install` as install → verify → rollback, with each stage in a separate node before `finish` is reachable.
  - [ ] Gate completion on a concrete verification artifact (status output, log snapshot, or expected-state item) and a brief interpretation checkpoint.
  - [ ] add rollback/lockout-avoidance handling for `heater install`, then require a clean re-verify pass before retrying the install path.
- `aquaria/log-water-parameters`
  - [ ] Define acceptance criteria for `aquaria/log-water-parameters` logs/monitoring (required fields, cadence, and threshold bounds) before `finish` can unlock.
  - [ ] Add an anomaly branch that classifies abnormal output and records corrective action before returning to normal monitoring.
  - [ ] require a follow-up verification window (fresh log slice or monitor snapshot) before closure.
- `aquaria/net-fish`
  - [ ] Split `aquaria/net-fish` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `aquaria/ph-strip-test`
  - [ ] Require `aquaria/ph-strip-test` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `aquaria/position-tank`
  - [ ] Split `aquaria/position-tank` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `aquaria/shrimp`
  - [ ] Stage `aquaria/shrimp` with two proofs: a setup artifact first and an outcome artifact later; require both before `finish`.
  - [ ] Add a contingency branch for stress/failure signs with concrete corrective actions and a timed re-check checkpoint.
  - [ ] Define pause/abort criteria so progression halts on worsening signals and resumes only after recovery evidence is logged.
- `aquaria/sponge-filter`
  - [ ] Split `aquaria/sponge-filter` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `aquaria/thermometer`
  - [ ] Split `aquaria/thermometer` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `aquaria/top-off`
  - [ ] Split `aquaria/top-off` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `aquaria/walstad`
  - [ ] Stage `aquaria/walstad` with two proofs: a setup artifact first and an outcome artifact later; require both before `finish`.
  - [ ] Add a contingency branch for stress/failure signs with concrete corrective actions and a timed re-check checkpoint.
  - [ ] Define pause/abort criteria so progression halts on worsening signals and resumes only after recovery evidence is logged.
- `aquaria/water-change`
  - [ ] Split `aquaria/water-change` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `aquaria/water-testing`
  - [ ] Require `aquaria/water-testing` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.

### astronomy (21 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): hydroponics/nutrient-check, composting/check-temperature (fallback: no checked astronomy quests yet)

- `astronomy/andromeda`
  - [ ] Split `astronomy/andromeda` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `astronomy/aurora-watch`
  - [ ] Add an explicit seeing/weather/light-pollution fallback branch in `astronomy/aurora-watch` before observation can be marked complete.
  - [ ] Require an observation artifact (log, sketch, or photo surrogate) plus an interpretation node before `finish` unlocks.
  - [ ] Add failed-session troubleshooting (conditions and adjustments) with a follow-up observation check before closure.
- `astronomy/basic-telescope`
  - [ ] Split `astronomy/basic-telescope` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `astronomy/binary-star`
  - [ ] Split `astronomy/binary-star` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `astronomy/comet-tracking`
  - [ ] Split `astronomy/comet-tracking` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `astronomy/constellations`
  - [ ] Split `astronomy/constellations` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `astronomy/iss-flyover`
  - [ ] Add an explicit seeing/weather/light-pollution fallback branch in `astronomy/iss-flyover` before observation can be marked complete.
  - [ ] Require an observation artifact (log, sketch, or photo surrogate) plus an interpretation node before `finish` unlocks.
  - [ ] Add failed-session troubleshooting (conditions and adjustments) with a follow-up observation check before closure.
- `astronomy/iss-photo`
  - [ ] Require `astronomy/iss-photo` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `astronomy/jupiter-moons`
  - [ ] Split `astronomy/jupiter-moons` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `astronomy/light-pollution`
  - [ ] Split `astronomy/light-pollution` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `astronomy/lunar-eclipse`
  - [ ] Require `astronomy/lunar-eclipse` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `astronomy/meteor-shower`
  - [ ] Add an explicit seeing/weather/light-pollution fallback branch in `astronomy/meteor-shower` before observation can be marked complete.
  - [ ] Require an observation artifact (log, sketch, or photo surrogate) plus an interpretation node before `finish` unlocks.
  - [ ] Add failed-session troubleshooting (conditions and adjustments) with a follow-up observation check before closure.
- `astronomy/north-star`
  - [ ] Split `astronomy/north-star` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `astronomy/observe-moon`
  - [ ] Add an explicit seeing/weather/light-pollution fallback branch in `astronomy/observe-moon` before observation can be marked complete.
  - [ ] Require an observation artifact (log, sketch, or photo surrogate) plus an interpretation node before `finish` unlocks.
  - [ ] Add failed-session troubleshooting (conditions and adjustments) with a follow-up observation check before closure.
- `astronomy/orion-nebula`
  - [ ] Add an explicit seeing/weather/light-pollution fallback branch in `astronomy/orion-nebula` before observation can be marked complete.
  - [ ] Require an observation artifact (log, sketch, or photo surrogate) plus an interpretation node before `finish` unlocks.
  - [ ] Add failed-session troubleshooting (conditions and adjustments) with a follow-up observation check before closure.
- `astronomy/planetary-alignment`
  - [ ] Split `astronomy/planetary-alignment` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `astronomy/satellite-pass`
  - [ ] Add an explicit seeing/weather/light-pollution fallback branch in `astronomy/satellite-pass` before observation can be marked complete.
  - [ ] Require an observation artifact (log, sketch, or photo surrogate) plus an interpretation node before `finish` unlocks.
  - [ ] Add failed-session troubleshooting (conditions and adjustments) with a follow-up observation check before closure.
- `astronomy/saturn-rings`
  - [ ] Add an explicit seeing/weather/light-pollution fallback branch in `astronomy/saturn-rings` before observation can be marked complete.
  - [ ] Require an observation artifact (log, sketch, or photo surrogate) plus an interpretation node before `finish` unlocks.
  - [ ] Add failed-session troubleshooting (conditions and adjustments) with a follow-up observation check before closure.
- `astronomy/star-trails`
  - [ ] Split `astronomy/star-trails` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `astronomy/sunspot-sketch`
  - [ ] Split `astronomy/sunspot-sketch` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `astronomy/venus-phases`
  - [ ] Require `astronomy/venus-phases` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.

### chemistry (10 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): hydroponics/nutrient-check, composting/check-temperature (fallback: no checked chemistry quests yet)

- `chemistry/acid-dilution`
  - [ ] Split `chemistry/acid-dilution` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `chemistry/acid-neutralization`
  - [ ] Split `chemistry/acid-neutralization` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `chemistry/buffer-solution`
  - [ ] Split `chemistry/buffer-solution` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `chemistry/ph-adjustment`
  - [ ] Require `chemistry/ph-adjustment` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `chemistry/ph-test`
  - [ ] Require `chemistry/ph-test` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `chemistry/precipitation-reaction`
  - [ ] Require `chemistry/precipitation-reaction` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `chemistry/safe-reaction`
  - [ ] Split `chemistry/safe-reaction` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `chemistry/stevia-crystals`
  - [ ] Stage `chemistry/stevia-crystals` with two proofs: a setup artifact first and an outcome artifact later; require both before `finish`.
  - [ ] Add a contingency branch for stress/failure signs with concrete corrective actions and a timed re-check checkpoint.
  - [ ] Define pause/abort criteria so progression halts on worsening signals and resumes only after recovery evidence is logged.
- `chemistry/stevia-extraction`
  - [ ] Stage `chemistry/stevia-extraction` with two proofs: a setup artifact first and an outcome artifact later; require both before `finish`.
  - [ ] Add a contingency branch for stress/failure signs with concrete corrective actions and a timed re-check checkpoint.
  - [ ] Define pause/abort criteria so progression halts on worsening signals and resumes only after recovery evidence is logged.
- `chemistry/stevia-tasting`
  - [ ] Stage `chemistry/stevia-tasting` with two proofs: a setup artifact first and an outcome artifact later; require both before `finish`.
  - [ ] Add a contingency branch for stress/failure signs with concrete corrective actions and a timed re-check checkpoint.
  - [ ] Define pause/abort criteria so progression halts on worsening signals and resumes only after recovery evidence is logged.

### completionist (5 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): welcome/howtodoquests, welcome/intro-inventory (fallback: no checked completionist quests yet)

- `completionist/catalog`
  - [ ] Define acceptance criteria for `completionist/catalog` logs/monitoring (required fields, cadence, and threshold bounds) before `finish` can unlock.
  - [ ] Add an anomaly branch that classifies abnormal output and records corrective action before returning to normal monitoring.
  - [ ] require a follow-up verification window (fresh log slice or monitor snapshot) before closure.
- `completionist/display`
  - [ ] Split `completionist/display` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `completionist/polish`
  - [ ] Split `completionist/polish` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `completionist/reminder`
  - [ ] Split `completionist/reminder` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `completionist/v2`
  - [ ] Split `completionist/v2` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.

### devops (15 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): sysadmin/log-analysis, sysadmin/resource-monitoring (fallback: no checked devops quests yet)

- `devops/auto-updates`
  - [ ] Split `devops/auto-updates` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `devops/ci-pipeline`
  - [ ] Split `devops/ci-pipeline` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `devops/daily-backups`
  - [ ] Split `devops/daily-backups` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `devops/docker-compose`
  - [ ] Split `devops/docker-compose` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `devops/enable-https`
  - [ ] Rewrite `devops/enable-https` as install → verify → rollback, with each stage in a separate node before `finish` is reachable.
  - [ ] Gate completion on a concrete verification artifact (status output, log snapshot, or expected-state item) and a brief interpretation checkpoint.
  - [ ] Safety note: add rollback/lockout-avoidance handling for `enable https`, then require a clean re-verify pass before retrying the install path.
- `devops/fail2ban`
  - [ ] Split `devops/fail2ban` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `devops/firewall-rules`
  - [ ] Split `devops/firewall-rules` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `devops/k3s-deploy`
  - [ ] Rewrite `devops/k3s-deploy` as install → verify → rollback, with each stage in a separate node before `finish` is reachable.
  - [ ] Gate completion on a concrete verification artifact (status output, log snapshot, or expected-state item) and a brief interpretation checkpoint.
  - [ ] Safety note: add rollback/lockout-avoidance handling for `k3s deploy`, then require a clean re-verify pass before retrying the install path.
- `devops/log-maintenance`
  - [ ] Define acceptance criteria for `devops/log-maintenance` logs/monitoring (required fields, cadence, and threshold bounds) before `finish` can unlock.
  - [ ] Add an anomaly branch that classifies abnormal output and records corrective action before returning to normal monitoring.
  - [ ] Safety note: require a follow-up verification window (fresh log slice or monitor snapshot) before closure.
- `devops/monitoring`
  - [ ] Define acceptance criteria for `devops/monitoring` logs/monitoring (required fields, cadence, and threshold bounds) before `finish` can unlock.
  - [ ] Add an anomaly branch that classifies abnormal output and records corrective action before returning to normal monitoring.
  - [ ] Safety note: require a follow-up verification window (fresh log slice or monitor snapshot) before closure.
- `devops/pi-cluster-hardware`
  - [ ] Split `devops/pi-cluster-hardware` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `devops/prepare-first-node`
  - [ ] Split `devops/prepare-first-node` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `devops/private-registry`
  - [ ] Split `devops/private-registry` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `devops/ssd-boot`
  - [ ] Split `devops/ssd-boot` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `devops/ssh-hardening`
  - [ ] Split `devops/ssh-hardening` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.

### electronics (22 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): sysadmin/resource-monitoring, hydroponics/nutrient-check (fallback: no checked electronics quests yet)

- `electronics/arduino-blink`
  - [ ] Split `electronics/arduino-blink` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `electronics/basic-circuit`
  - [ ] Split `electronics/basic-circuit` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `electronics/check-battery-voltage`
  - [ ] Require `electronics/check-battery-voltage` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `electronics/continuity-test`
  - [ ] Require `electronics/continuity-test` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `electronics/data-logger`
  - [ ] Define acceptance criteria for `electronics/data-logger` logs/monitoring (required fields, cadence, and threshold bounds) before `finish` can unlock.
  - [ ] Add an anomaly branch that classifies abnormal output and records corrective action before returning to normal monitoring.
  - [ ] Safety note: require a follow-up verification window (fresh log slice or monitor snapshot) before closure.
- `electronics/desolder-component`
  - [ ] Split `electronics/desolder-component` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `electronics/led-polarity`
  - [ ] Split `electronics/led-polarity` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `electronics/light-sensor`
  - [ ] Split `electronics/light-sensor` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `electronics/measure-arduino-5v`
  - [ ] Require `electronics/measure-arduino-5v` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `electronics/measure-led-current`
  - [ ] Require `electronics/measure-led-current` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `electronics/measure-resistance`
  - [ ] Require `electronics/measure-resistance` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `electronics/potentiometer-dimmer`
  - [ ] Split `electronics/potentiometer-dimmer` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `electronics/resistor-color-check`
  - [ ] Require `electronics/resistor-color-check` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `electronics/servo-sweep`
  - [ ] Split `electronics/servo-sweep` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `electronics/solder-led-harness`
  - [ ] Split `electronics/solder-led-harness` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `electronics/solder-wire`
  - [ ] Split `electronics/solder-wire` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `electronics/soldering-intro`
  - [ ] Split `electronics/soldering-intro` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `electronics/temperature-plot`
  - [ ] Require `electronics/temperature-plot` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `electronics/test-gfci-outlet`
  - [ ] Require `electronics/test-gfci-outlet` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `electronics/thermistor-reading`
  - [ ] Split `electronics/thermistor-reading` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `electronics/thermometer-calibration`
  - [ ] Split `electronics/thermometer-calibration` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `electronics/voltage-divider`
  - [ ] Require `electronics/voltage-divider` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.

### energy (11 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): sysadmin/resource-monitoring, hydroponics/nutrient-check (fallback: no checked energy quests yet)

- `energy/battery-maintenance`
  - [ ] Define acceptance criteria for `energy/battery-maintenance` logs/monitoring (required fields, cadence, and threshold bounds) before `finish` can unlock.
  - [ ] Add an anomaly branch that classifies abnormal output and records corrective action before returning to normal monitoring.
  - [ ] Safety note: require a follow-up verification window (fresh log slice or monitor snapshot) before closure.
- `energy/battery-upgrade`
  - [ ] Split `energy/battery-upgrade` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `energy/biogas-digester`
  - [ ] Split `energy/biogas-digester` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `energy/charge-controller-setup`
  - [ ] Rewrite `energy/charge-controller-setup` as install → verify → rollback, with each stage in a separate node before `finish` is reachable.
  - [ ] Gate completion on a concrete verification artifact (status output, log snapshot, or expected-state item) and a brief interpretation checkpoint.
  - [ ] Safety note: add rollback/lockout-avoidance handling for `charge controller setup`, then require a clean re-verify pass before retrying the install path.
- `energy/hand-crank-generator`
  - [ ] Split `energy/hand-crank-generator` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `energy/offgrid-charger`
  - [ ] Split `energy/offgrid-charger` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `energy/portable-solar-panel`
  - [ ] Split `energy/portable-solar-panel` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `energy/power-inverter`
  - [ ] Split `energy/power-inverter` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `energy/solar-tracker`
  - [ ] Split `energy/solar-tracker` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `energy/solar`
  - [ ] Split `energy/solar` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `energy/wind-turbine`
  - [ ] Split `energy/wind-turbine` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.

### firstaid (13 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): welcome/howtodoquests, welcome/intro-inventory (fallback: no checked firstaid quests yet)

- `firstaid/assemble-kit`
  - [ ] Split `firstaid/assemble-kit` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `firstaid/change-bandage`
  - [ ] Split `firstaid/change-bandage` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `firstaid/dispose-bandages`
  - [ ] Split `firstaid/dispose-bandages` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `firstaid/dispose-expired`
  - [ ] Split `firstaid/dispose-expired` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `firstaid/flashlight-battery`
  - [ ] Split `firstaid/flashlight-battery` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `firstaid/learn-cpr`
  - [ ] Split `firstaid/learn-cpr` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `firstaid/remove-splinter`
  - [ ] Split `firstaid/remove-splinter` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `firstaid/restock-kit`
  - [ ] Split `firstaid/restock-kit` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `firstaid/sanitize-pocket-mask`
  - [ ] Split `firstaid/sanitize-pocket-mask` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `firstaid/splint-limb`
  - [ ] Split `firstaid/splint-limb` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `firstaid/stop-nosebleed`
  - [ ] Split `firstaid/stop-nosebleed` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `firstaid/treat-burn`
  - [ ] Split `firstaid/treat-burn` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `firstaid/wound-care`
  - [ ] Split `firstaid/wound-care` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.

### geothermal (15 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): hydroponics/nutrient-check, composting/check-temperature (fallback: no checked geothermal quests yet)

- `geothermal/backflush-loop-filter`
  - [ ] Split `geothermal/backflush-loop-filter` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `geothermal/calibrate-ground-sensor`
  - [ ] Structure `geothermal/calibrate-ground-sensor` as baseline → adjust → re-test with a stated tolerance target that gates completion.
  - [ ] Require evidence artifacts for both baseline and post-adjust states (reading snapshots, process output, or logged values).
  - [ ] Add a drift/variance branch: if results do not hold on follow-up, roll back to last-known-good settings and repeat the loop.
- `geothermal/check-loop-inlet-temp`
  - [ ] Require `geothermal/check-loop-inlet-temp` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `geothermal/check-loop-outlet-temp`
  - [ ] Require `geothermal/check-loop-outlet-temp` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `geothermal/check-loop-pressure`
  - [ ] Require `geothermal/check-loop-pressure` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `geothermal/check-loop-temp-delta`
  - [ ] Require `geothermal/check-loop-temp-delta` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `geothermal/compare-depth-ground-temps`
  - [ ] Require `geothermal/compare-depth-ground-temps` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `geothermal/compare-seasonal-ground-temps`
  - [ ] Require `geothermal/compare-seasonal-ground-temps` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `geothermal/install-backup-thermistor`
  - [ ] Rewrite `geothermal/install-backup-thermistor` as install → verify → rollback, with each stage in a separate node before `finish` is reachable.
  - [ ] Gate completion on a concrete verification artifact (status output, log snapshot, or expected-state item) and a brief interpretation checkpoint.
  - [ ] add rollback/lockout-avoidance handling for `install backup thermistor`, then require a clean re-verify pass before retrying the install path.
- `geothermal/log-ground-temperature`
  - [ ] Require `geothermal/log-ground-temperature` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `geothermal/log-heat-pump-warmup`
  - [ ] Define acceptance criteria for `geothermal/log-heat-pump-warmup` logs/monitoring (required fields, cadence, and threshold bounds) before `finish` can unlock.
  - [ ] Add an anomaly branch that classifies abnormal output and records corrective action before returning to normal monitoring.
  - [ ] require a follow-up verification window (fresh log slice or monitor snapshot) before closure.
- `geothermal/monitor-heat-pump-energy`
  - [ ] Define acceptance criteria for `geothermal/monitor-heat-pump-energy` logs/monitoring (required fields, cadence, and threshold bounds) before `finish` can unlock.
  - [ ] Add an anomaly branch that classifies abnormal output and records corrective action before returning to normal monitoring.
  - [ ] require a follow-up verification window (fresh log slice or monitor snapshot) before closure.
- `geothermal/purge-loop-air`
  - [ ] Define `geothermal/purge-loop-air` clean-state success using measurable before/after condition checks (residue, flow, clarity, or signal quality).
  - [ ] Gate completion on paired artifacts (pre-state + post-state) proving the state change in mechanics, not just dialogue.
  - [ ] Add a contamination/failure branch with a safe re-entry checkpoint and a loop that repeats until post-clean criteria pass.
- `geothermal/replace-faulty-thermistor`
  - [ ] Split `geothermal/replace-faulty-thermistor` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `geothermal/survey-ground-temperature`
  - [ ] Require `geothermal/survey-ground-temperature` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.

### hydroponics (21 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): hydroponics/basil, hydroponics/nutrient-check

- `hydroponics/air-stone-soak`
  - [ ] Split `hydroponics/air-stone-soak` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `hydroponics/bucket_10`
  - [ ] Split `hydroponics/bucket_10` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `hydroponics/ec-calibrate`
  - [ ] Require `hydroponics/ec-calibrate` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `hydroponics/ec-check`
  - [ ] Require `hydroponics/ec-check` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `hydroponics/filter-clean`
  - [ ] Define `hydroponics/filter-clean` clean-state success using measurable before/after condition checks (residue, flow, clarity, or signal quality).
  - [ ] Gate completion on paired artifacts (pre-state + post-state) proving the state change in mechanics, not just dialogue.
  - [ ] Add a contamination/failure branch with a safe re-entry checkpoint and a loop that repeats until post-clean criteria pass.
- `hydroponics/grow-light`
  - [ ] Split `hydroponics/grow-light` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `hydroponics/lettuce`
  - [ ] Stage `hydroponics/lettuce` with two proofs: a setup artifact first and an outcome artifact later; require both before `finish`.
  - [ ] Add a contingency branch for stress/failure signs with concrete corrective actions and a timed re-check checkpoint.
  - [ ] Define pause/abort criteria so progression halts on worsening signals and resumes only after recovery evidence is logged.
- `hydroponics/mint-cutting`
  - [ ] Stage `hydroponics/mint-cutting` with two proofs: a setup artifact first and an outcome artifact later; require both before `finish`.
  - [ ] Add a contingency branch for stress/failure signs with concrete corrective actions and a timed re-check checkpoint.
  - [ ] Define pause/abort criteria so progression halts on worsening signals and resumes only after recovery evidence is logged.
- `hydroponics/netcup-clean`
  - [ ] Define `hydroponics/netcup-clean` clean-state success using measurable before/after condition checks (residue, flow, clarity, or signal quality).
  - [ ] Gate completion on paired artifacts (pre-state + post-state) proving the state change in mechanics, not just dialogue.
  - [ ] Add a contamination/failure branch with a safe re-entry checkpoint and a loop that repeats until post-clean criteria pass.
- `hydroponics/ph-check`
  - [ ] Require `hydroponics/ph-check` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `hydroponics/ph-test`
  - [ ] Require `hydroponics/ph-test` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `hydroponics/plug-soak`
  - [ ] Split `hydroponics/plug-soak` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `hydroponics/pump-install`
  - [ ] Rewrite `hydroponics/pump-install` as install → verify → rollback, with each stage in a separate node before `finish` is reachable.
  - [ ] Gate completion on a concrete verification artifact (status output, log snapshot, or expected-state item) and a brief interpretation checkpoint.
  - [ ] add rollback/lockout-avoidance handling for `pump install`, then require a clean re-verify pass before retrying the install path.
- `hydroponics/pump-prime`
  - [ ] Define `hydroponics/pump-prime` clean-state success using measurable before/after condition checks (residue, flow, clarity, or signal quality).
  - [ ] Gate completion on paired artifacts (pre-state + post-state) proving the state change in mechanics, not just dialogue.
  - [ ] Add a contamination/failure branch with a safe re-entry checkpoint and a loop that repeats until post-clean criteria pass.
- `hydroponics/regrow-stevia`
  - [ ] Stage `hydroponics/regrow-stevia` with two proofs: a setup artifact first and an outcome artifact later; require both before `finish`.
  - [ ] Add a contingency branch for stress/failure signs with concrete corrective actions and a timed re-check checkpoint.
  - [ ] Define pause/abort criteria so progression halts on worsening signals and resumes only after recovery evidence is logged.
- `hydroponics/reservoir-refresh`
  - [ ] Split `hydroponics/reservoir-refresh` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `hydroponics/root-rinse`
  - [ ] Define `hydroponics/root-rinse` clean-state success using measurable before/after condition checks (residue, flow, clarity, or signal quality).
  - [ ] Gate completion on paired artifacts (pre-state + post-state) proving the state change in mechanics, not just dialogue.
  - [ ] Add a contamination/failure branch with a safe re-entry checkpoint and a loop that repeats until post-clean criteria pass.
- `hydroponics/stevia`
  - [ ] Stage `hydroponics/stevia` with two proofs: a setup artifact first and an outcome artifact later; require both before `finish`.
  - [ ] Add a contingency branch for stress/failure signs with concrete corrective actions and a timed re-check checkpoint.
  - [ ] Define pause/abort criteria so progression halts on worsening signals and resumes only after recovery evidence is logged.
- `hydroponics/temp-check`
  - [ ] Require `hydroponics/temp-check` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `hydroponics/top-off`
  - [ ] Split `hydroponics/top-off` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `hydroponics/tub-scrub`
  - [ ] Define `hydroponics/tub-scrub` clean-state success using measurable before/after condition checks (residue, flow, clarity, or signal quality).
  - [ ] Gate completion on paired artifacts (pre-state + post-state) proving the state change in mechanics, not just dialogue.
  - [ ] Add a contamination/failure branch with a safe re-entry checkpoint and a loop that repeats until post-clean criteria pass.

### programming (18 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): sysadmin/basic-commands, sysadmin/log-analysis (fallback: no checked programming quests yet)

- `programming/avg-temp`
  - [ ] Require `programming/avg-temp` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `programming/graph-temp-data`
  - [ ] Require `programming/graph-temp-data` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `programming/graph-temp`
  - [ ] Require `programming/graph-temp` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `programming/hello-sensor`
  - [ ] Split `programming/hello-sensor` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `programming/http-post`
  - [ ] Split `programming/http-post` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `programming/json-api`
  - [ ] Split `programming/json-api` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `programming/json-endpoint`
  - [ ] Split `programming/json-endpoint` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `programming/median-temp`
  - [ ] Require `programming/median-temp` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `programming/moving-avg-temp`
  - [ ] Require `programming/moving-avg-temp` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `programming/plot-temp-cli`
  - [ ] Require `programming/plot-temp-cli` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `programming/stddev-temp`
  - [ ] Require `programming/stddev-temp` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `programming/temp-alert`
  - [ ] Require `programming/temp-alert` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `programming/temp-email`
  - [ ] Require `programming/temp-email` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `programming/temp-graph`
  - [ ] Require `programming/temp-graph` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `programming/temp-json-api`
  - [ ] Require `programming/temp-json-api` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `programming/temp-logger`
  - [ ] Require `programming/temp-logger` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `programming/thermistor-calibration`
  - [ ] Split `programming/thermistor-calibration` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `programming/web-server`
  - [ ] Split `programming/web-server` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.

### robotics (13 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): 3dprinting/start, sysadmin/resource-monitoring (fallback: no checked robotics quests yet)

- `robotics/gyro-balance`
  - [ ] Split `robotics/gyro-balance` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `robotics/line-follower`
  - [ ] Split `robotics/line-follower` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `robotics/maze-navigation`
  - [ ] Split `robotics/maze-navigation` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `robotics/obstacle-avoidance`
  - [ ] Split `robotics/obstacle-avoidance` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `robotics/odometry-basics`
  - [ ] Split `robotics/odometry-basics` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `robotics/pan-tilt`
  - [ ] Split `robotics/pan-tilt` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `robotics/reflectance-sensors`
  - [ ] Require `robotics/reflectance-sensors` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `robotics/servo-arm`
  - [ ] Split `robotics/servo-arm` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `robotics/servo-control`
  - [ ] Split `robotics/servo-control` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `robotics/servo-gripper`
  - [ ] Split `robotics/servo-gripper` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `robotics/servo-radar`
  - [ ] Split `robotics/servo-radar` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `robotics/ultrasonic-rangefinder`
  - [ ] Split `robotics/ultrasonic-rangefinder` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `robotics/wheel-encoders`
  - [ ] Split `robotics/wheel-encoders` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.

### rocketry (10 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): welcome/run-tests, sysadmin/resource-monitoring (fallback: no checked rocketry quests yet)

- `rocketry/firstlaunch`
  - [ ] Split `rocketry/firstlaunch` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `rocketry/fuel-mixture`
  - [ ] Split `rocketry/fuel-mixture` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `rocketry/guided-rocket-build`
  - [ ] Split `rocketry/guided-rocket-build` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `rocketry/night-launch`
  - [ ] Split `rocketry/night-launch` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `rocketry/parachute`
  - [ ] Split `rocketry/parachute` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `rocketry/preflight-check`
  - [ ] Require `rocketry/preflight-check` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `rocketry/recovery-run`
  - [ ] Require `rocketry/recovery-run` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `rocketry/static-test`
  - [ ] Require `rocketry/static-test` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.
- `rocketry/suborbital-hop`
  - [ ] Split `rocketry/suborbital-hop` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `rocketry/wind-check`
  - [ ] Require `rocketry/wind-check` to capture a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action and a mandatory re-test loop before returning to the success path.
  - [ ] Use explicit acceptance thresholds (target range and fail bounds) so completion depends on measured values, not narration alone.

### ubi (3 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): ubi/basicincome, welcome/howtodoquests

- `ubi/first-payment`
  - [ ] Split `ubi/first-payment` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `ubi/reminder`
  - [ ] Split `ubi/reminder` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `ubi/savings-goal`
  - [ ] Split `ubi/savings-goal` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.

### woodworking (10 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): 3dprinting/start, welcome/howtodoquests (fallback: no checked woodworking quests yet)

- `woodworking/apply-finish`
  - [ ] Split `woodworking/apply-finish` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `woodworking/birdhouse`
  - [ ] Split `woodworking/birdhouse` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `woodworking/bookshelf`
  - [ ] Split `woodworking/bookshelf` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `woodworking/coffee-table`
  - [ ] Split `woodworking/coffee-table` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `woodworking/finish-sanding`
  - [ ] Split `woodworking/finish-sanding` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `woodworking/picture-frame`
  - [ ] Split `woodworking/picture-frame` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `woodworking/planter-box`
  - [ ] Split `woodworking/planter-box` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `woodworking/step-stool`
  - [ ] Split `woodworking/step-stool` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `woodworking/tool-rack`
  - [ ] Split `woodworking/tool-rack` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.
- `woodworking/workbench`
  - [ ] Split `woodworking/workbench` into a primary build path and an alternate strategy path so completion is a choice, not a single straight-through step.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or produced/logged output) with a short interpretation node.
  - [ ] Add a troubleshooting branch that records failure signals, recovery actions, and a verification retry before `finish`.

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
