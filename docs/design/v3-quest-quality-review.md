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

Matching rule: assign each quest to the **first** matching type above and use that checklist shape. Include an explicit `Safety note:` bullet only for chemistry, firstaid, devops, electronics, energy, and rocketry entries where risk handling is plausible.

### 3dprinting (15 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): 3dprinting/start

- `3dprinting/bed-leveling`
  - [ ] Convert `3dprinting/bed-leveling` to baseline → adjust → re-test, with an explicit tolerance target that gates completion.
  - [ ] Attach mechanics-backed artifacts to each phase (baseline capture, adjustment action, and post-adjust verification).
  - [ ] Add a drift branch: if results do not hold after a short interval, route to diagnosis and repeat the loop.
- `3dprinting/benchy_10`
  - [ ] Split `3dprinting/benchy_10` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `benchy_10` that records failure signals, recovery actions, and a verification retry.
- `3dprinting/benchy_100`
  - [ ] Split `3dprinting/benchy_100` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `benchy_100` that records failure signals, recovery actions, and a verification retry.
- `3dprinting/benchy_25`
  - [ ] Split `3dprinting/benchy_25` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `benchy_25` that records failure signals, recovery actions, and a verification retry.
- `3dprinting/blob-of-death`
  - [ ] Split `3dprinting/blob-of-death` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `blob of death` that records failure signals, recovery actions, and a verification retry.
- `3dprinting/cable-clip`
  - [ ] Split `3dprinting/cable-clip` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `cable clip` that records failure signals, recovery actions, and a verification retry.
- `3dprinting/calibration-cube`
  - [ ] Convert `3dprinting/calibration-cube` to baseline → adjust → re-test, with an explicit tolerance target that gates completion.
  - [ ] Attach mechanics-backed artifacts to each phase (baseline capture, adjustment action, and post-adjust verification).
  - [ ] Add a drift branch: if results do not hold after a short interval, route to diagnosis and repeat the loop.
- `3dprinting/filament-change`
  - [ ] Split `3dprinting/filament-change` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `filament change` that records failure signals, recovery actions, and a verification retry.
- `3dprinting/nozzle-cleaning`
  - [ ] Split `3dprinting/nozzle-cleaning` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `nozzle cleaning` that records failure signals, recovery actions, and a verification retry.
- `3dprinting/nozzle-clog`
  - [ ] Split `3dprinting/nozzle-clog` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `nozzle clog` that records failure signals, recovery actions, and a verification retry.
- `3dprinting/phone-stand`
  - [ ] Split `3dprinting/phone-stand` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `phone stand` that records failure signals, recovery actions, and a verification retry.
- `3dprinting/retraction-test`
  - [ ] Require `3dprinting/retraction-test` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Require baseline + follow-up readings so players evaluate trend direction, not a single isolated number.
- `3dprinting/spool-holder`
  - [ ] Split `3dprinting/spool-holder` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `spool holder` that records failure signals, recovery actions, and a verification retry.
- `3dprinting/temperature-tower`
  - [ ] Split `3dprinting/temperature-tower` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `temperature tower` that records failure signals, recovery actions, and a verification retry.
- `3dprinting/x-belt-tension`
  - [ ] Convert `3dprinting/x-belt-tension` to baseline → adjust → re-test, with an explicit tolerance target that gates completion.
  - [ ] Attach mechanics-backed artifacts to each phase (baseline capture, adjustment action, and post-adjust verification).
  - [ ] Add a drift branch: if results do not hold after a short interval, route to diagnosis and repeat the loop.

### aquaria (19 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): hydroponics/nutrient-check, composting/check-temperature (fallback: no checked aquaria quests yet)

- `aquaria/aquarium-light`
  - [ ] Split `aquaria/aquarium-light` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `aquarium light` that records failure signals, recovery actions, and a verification retry.
- `aquaria/balance-ph`
  - [ ] Require `aquaria/balance-ph` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Require baseline + follow-up readings so players evaluate trend direction, not a single isolated number.
- `aquaria/breeding`
  - [ ] Stage `aquaria/breeding` with two proofs: setup artifact first, then lifecycle/outcome artifact later; require both before `finish`.
  - [ ] Add a contingency branch for stress/failure signs with concrete corrective actions and a timed re-check checkpoint.
  - [ ] Include pause/abort criteria so progression halts when outcomes regress and resumes only after recovery evidence.
- `aquaria/filter-rinse`
  - [ ] Define before/after condition checks in `aquaria/filter-rinse` so “clean” is measurable (residue, flow, clarity, signal quality, etc.).
  - [ ] Gate completion on paired mechanics-backed artifacts (pre-clean state + post-clean state), not narration alone.
  - [ ] Add a contamination/failure branch with a safe re-entry checkpoint, then loop until after-check criteria pass.
- `aquaria/floating-plants`
  - [ ] Split `aquaria/floating-plants` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `floating plants` that records failure signals, recovery actions, and a verification retry.
- `aquaria/goldfish`
  - [ ] Stage `aquaria/goldfish` with two proofs: setup artifact first, then lifecycle/outcome artifact later; require both before `finish`.
  - [ ] Add a contingency branch for stress/failure signs with concrete corrective actions and a timed re-check checkpoint.
  - [ ] Include pause/abort criteria so progression halts when outcomes regress and resumes only after recovery evidence.
- `aquaria/guppy`
  - [ ] Stage `aquaria/guppy` with two proofs: setup artifact first, then lifecycle/outcome artifact later; require both before `finish`.
  - [ ] Add a contingency branch for stress/failure signs with concrete corrective actions and a timed re-check checkpoint.
  - [ ] Include pause/abort criteria so progression halts when outcomes regress and resumes only after recovery evidence.
- `aquaria/heater-install`
  - [ ] Structure `aquaria/heater-install` as install → verify → rollback, with `finish` gated by a post-change artifact (status output, config diff, or expected-state item).
  - [ ] Make verification explicit in mechanics: capture a process/log artifact and add an interpretation node that confirms the change works under normal conditions.
  - [ ] Add a failed-verify branch for `heater install` that forces rollback, then reruns verification before success can resume.
- `aquaria/log-water-parameters`
  - [ ] Define acceptance criteria for `aquaria/log-water-parameters` monitoring output (required fields, cadence, and threshold bounds) and gate `finish` on that artifact.
  - [ ] Add an anomaly branch that requires classification + corrective action before returning to nominal monitoring.
  - [ ] Require a follow-up verification window after correction (fresh log slice or monitor snapshot) before closure.
- `aquaria/net-fish`
  - [ ] Split `aquaria/net-fish` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `net fish` that records failure signals, recovery actions, and a verification retry.
- `aquaria/ph-strip-test`
  - [ ] Require `aquaria/ph-strip-test` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Require baseline + follow-up readings so players evaluate trend direction, not a single isolated number.
- `aquaria/position-tank`
  - [ ] Split `aquaria/position-tank` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `position tank` that records failure signals, recovery actions, and a verification retry.
- `aquaria/shrimp`
  - [ ] Stage `aquaria/shrimp` with two proofs: setup artifact first, then lifecycle/outcome artifact later; require both before `finish`.
  - [ ] Add a contingency branch for stress/failure signs with concrete corrective actions and a timed re-check checkpoint.
  - [ ] Include pause/abort criteria so progression halts when outcomes regress and resumes only after recovery evidence.
- `aquaria/sponge-filter`
  - [ ] Split `aquaria/sponge-filter` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `sponge filter` that records failure signals, recovery actions, and a verification retry.
- `aquaria/thermometer`
  - [ ] Split `aquaria/thermometer` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `thermometer` that records failure signals, recovery actions, and a verification retry.
- `aquaria/top-off`
  - [ ] Split `aquaria/top-off` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `top off` that records failure signals, recovery actions, and a verification retry.
- `aquaria/walstad`
  - [ ] Stage `aquaria/walstad` with two proofs: setup artifact first, then lifecycle/outcome artifact later; require both before `finish`.
  - [ ] Add a contingency branch for stress/failure signs with concrete corrective actions and a timed re-check checkpoint.
  - [ ] Include pause/abort criteria so progression halts when outcomes regress and resumes only after recovery evidence.
- `aquaria/water-change`
  - [ ] Split `aquaria/water-change` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `water change` that records failure signals, recovery actions, and a verification retry.
- `aquaria/water-testing`
  - [ ] Split `aquaria/water-testing` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `water testing` that records failure signals, recovery actions, and a verification retry.

### astronomy (21 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): sysadmin/log-analysis, hydroponics/nutrient-check (fallback: no checked astronomy quests yet)

- `astronomy/andromeda`
  - [ ] Split `astronomy/andromeda` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `andromeda` that records failure signals, recovery actions, and a verification retry.
- `astronomy/aurora-watch`
  - [ ] Add seeing-condition fallback paths in `astronomy/aurora-watch` for weather, cloud cover, light pollution, or timing-window misses.
  - [ ] Require an observation artifact (log, sketch, or photo surrogate item) plus an interpretation node with at least one concrete finding.
  - [ ] Add failed-session troubleshooting (alternate target/location/setup) and require a follow-up observation check before completion.
- `astronomy/basic-telescope`
  - [ ] Split `astronomy/basic-telescope` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `basic telescope` that records failure signals, recovery actions, and a verification retry.
- `astronomy/binary-star`
  - [ ] Split `astronomy/binary-star` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `binary star` that records failure signals, recovery actions, and a verification retry.
- `astronomy/comet-tracking`
  - [ ] Split `astronomy/comet-tracking` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `comet tracking` that records failure signals, recovery actions, and a verification retry.
- `astronomy/constellations`
  - [ ] Split `astronomy/constellations` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `constellations` that records failure signals, recovery actions, and a verification retry.
- `astronomy/iss-flyover`
  - [ ] Add seeing-condition fallback paths in `astronomy/iss-flyover` for weather, cloud cover, light pollution, or timing-window misses.
  - [ ] Require an observation artifact (log, sketch, or photo surrogate item) plus an interpretation node with at least one concrete finding.
  - [ ] Add failed-session troubleshooting (alternate target/location/setup) and require a follow-up observation check before completion.
- `astronomy/iss-photo`
  - [ ] Add seeing-condition fallback paths in `astronomy/iss-photo` for weather, cloud cover, light pollution, or timing-window misses.
  - [ ] Require an observation artifact (log, sketch, or photo surrogate item) plus an interpretation node with at least one concrete finding.
  - [ ] Add failed-session troubleshooting (alternate target/location/setup) and require a follow-up observation check before completion.
- `astronomy/jupiter-moons`
  - [ ] Split `astronomy/jupiter-moons` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `jupiter moons` that records failure signals, recovery actions, and a verification retry.
- `astronomy/light-pollution`
  - [ ] Split `astronomy/light-pollution` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `light pollution` that records failure signals, recovery actions, and a verification retry.
- `astronomy/lunar-eclipse`
  - [ ] Add seeing-condition fallback paths in `astronomy/lunar-eclipse` for weather, cloud cover, light pollution, or timing-window misses.
  - [ ] Require an observation artifact (log, sketch, or photo surrogate item) plus an interpretation node with at least one concrete finding.
  - [ ] Add failed-session troubleshooting (alternate target/location/setup) and require a follow-up observation check before completion.
- `astronomy/meteor-shower`
  - [ ] Add seeing-condition fallback paths in `astronomy/meteor-shower` for weather, cloud cover, light pollution, or timing-window misses.
  - [ ] Require an observation artifact (log, sketch, or photo surrogate item) plus an interpretation node with at least one concrete finding.
  - [ ] Add failed-session troubleshooting (alternate target/location/setup) and require a follow-up observation check before completion.
- `astronomy/north-star`
  - [ ] Split `astronomy/north-star` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `north star` that records failure signals, recovery actions, and a verification retry.
- `astronomy/observe-moon`
  - [ ] Add seeing-condition fallback paths in `astronomy/observe-moon` for weather, cloud cover, light pollution, or timing-window misses.
  - [ ] Require an observation artifact (log, sketch, or photo surrogate item) plus an interpretation node with at least one concrete finding.
  - [ ] Add failed-session troubleshooting (alternate target/location/setup) and require a follow-up observation check before completion.
- `astronomy/orion-nebula`
  - [ ] Add seeing-condition fallback paths in `astronomy/orion-nebula` for weather, cloud cover, light pollution, or timing-window misses.
  - [ ] Require an observation artifact (log, sketch, or photo surrogate item) plus an interpretation node with at least one concrete finding.
  - [ ] Add failed-session troubleshooting (alternate target/location/setup) and require a follow-up observation check before completion.
- `astronomy/planetary-alignment`
  - [ ] Split `astronomy/planetary-alignment` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `planetary alignment` that records failure signals, recovery actions, and a verification retry.
- `astronomy/satellite-pass`
  - [ ] Add seeing-condition fallback paths in `astronomy/satellite-pass` for weather, cloud cover, light pollution, or timing-window misses.
  - [ ] Require an observation artifact (log, sketch, or photo surrogate item) plus an interpretation node with at least one concrete finding.
  - [ ] Add failed-session troubleshooting (alternate target/location/setup) and require a follow-up observation check before completion.
- `astronomy/saturn-rings`
  - [ ] Add seeing-condition fallback paths in `astronomy/saturn-rings` for weather, cloud cover, light pollution, or timing-window misses.
  - [ ] Require an observation artifact (log, sketch, or photo surrogate item) plus an interpretation node with at least one concrete finding.
  - [ ] Add failed-session troubleshooting (alternate target/location/setup) and require a follow-up observation check before completion.
- `astronomy/star-trails`
  - [ ] Split `astronomy/star-trails` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `star trails` that records failure signals, recovery actions, and a verification retry.
- `astronomy/sunspot-sketch`
  - [ ] Split `astronomy/sunspot-sketch` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `sunspot sketch` that records failure signals, recovery actions, and a verification retry.
- `astronomy/venus-phases`
  - [ ] Split `astronomy/venus-phases` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `venus phases` that records failure signals, recovery actions, and a verification retry.

### chemistry (10 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): composting/start, hydroponics/nutrient-check (fallback: no checked chemistry quests yet)

- `chemistry/acid-dilution`
  - [ ] Split `chemistry/acid-dilution` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `chemistry/acid-neutralization`
  - [ ] Split `chemistry/acid-neutralization` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `chemistry/buffer-solution`
  - [ ] Split `chemistry/buffer-solution` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `chemistry/ph-adjustment`
  - [ ] Require `chemistry/ph-adjustment` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Safety note: set stop thresholds for unsafe readings and require pause/escalation until follow-up measurements return to a safe range.
- `chemistry/ph-test`
  - [ ] Require `chemistry/ph-test` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Safety note: set stop thresholds for unsafe readings and require pause/escalation until follow-up measurements return to a safe range.
- `chemistry/precipitation-reaction`
  - [ ] Split `chemistry/precipitation-reaction` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `chemistry/safe-reaction`
  - [ ] Split `chemistry/safe-reaction` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `chemistry/stevia-crystals`
  - [ ] Stage `chemistry/stevia-crystals` with two proofs: setup artifact first, then lifecycle/outcome artifact later; require both before `finish`.
  - [ ] Add a contingency branch for stress/failure signs with concrete corrective actions and a timed re-check checkpoint.
  - [ ] Safety note: define humane/safe pause-or-abort criteria and require stabilization evidence before progression resumes.
- `chemistry/stevia-extraction`
  - [ ] Stage `chemistry/stevia-extraction` with two proofs: setup artifact first, then lifecycle/outcome artifact later; require both before `finish`.
  - [ ] Add a contingency branch for stress/failure signs with concrete corrective actions and a timed re-check checkpoint.
  - [ ] Safety note: define humane/safe pause-or-abort criteria and require stabilization evidence before progression resumes.
- `chemistry/stevia-tasting`
  - [ ] Stage `chemistry/stevia-tasting` with two proofs: setup artifact first, then lifecycle/outcome artifact later; require both before `finish`.
  - [ ] Add a contingency branch for stress/failure signs with concrete corrective actions and a timed re-check checkpoint.
  - [ ] Safety note: define humane/safe pause-or-abort criteria and require stabilization evidence before progression resumes.

### completionist (5 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): welcome/intro-inventory, ubi/basicincome (fallback: no checked completionist quests yet)

- `completionist/catalog`
  - [ ] Split `completionist/catalog` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `catalog` that records failure signals, recovery actions, and a verification retry.
- `completionist/display`
  - [ ] Split `completionist/display` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `display` that records failure signals, recovery actions, and a verification retry.
- `completionist/polish`
  - [ ] Split `completionist/polish` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `polish` that records failure signals, recovery actions, and a verification retry.
- `completionist/reminder`
  - [ ] Split `completionist/reminder` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `reminder` that records failure signals, recovery actions, and a verification retry.
- `completionist/v2`
  - [ ] Split `completionist/v2` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `v2` that records failure signals, recovery actions, and a verification retry.

### devops (15 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): sysadmin/basic-commands, sysadmin/resource-monitoring (fallback: no checked devops quests yet)

- `devops/auto-updates`
  - [ ] Split `devops/auto-updates` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `devops/ci-pipeline`
  - [ ] Split `devops/ci-pipeline` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `devops/daily-backups`
  - [ ] Split `devops/daily-backups` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `devops/docker-compose`
  - [ ] Split `devops/docker-compose` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `devops/enable-https`
  - [ ] Structure `devops/enable-https` as install → verify → rollback, with `finish` gated by a post-change artifact (status output, config diff, or expected-state item).
  - [ ] Make verification explicit in mechanics: capture a process/log artifact and add an interpretation node that confirms the change works under normal conditions.
  - [ ] Safety note: add lockout-avoidance rollback steps (backup path, safe defaults, and re-entry checks) before any retry after failed verification.
- `devops/fail2ban`
  - [ ] Split `devops/fail2ban` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `devops/firewall-rules`
  - [ ] Split `devops/firewall-rules` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `devops/k3s-deploy`
  - [ ] Structure `devops/k3s-deploy` as install → verify → rollback, with `finish` gated by a post-change artifact (status output, config diff, or expected-state item).
  - [ ] Make verification explicit in mechanics: capture a process/log artifact and add an interpretation node that confirms the change works under normal conditions.
  - [ ] Safety note: add lockout-avoidance rollback steps (backup path, safe defaults, and re-entry checks) before any retry after failed verification.
- `devops/log-maintenance`
  - [ ] Define acceptance criteria for `devops/log-maintenance` monitoring output (required fields, cadence, and threshold bounds) and gate `finish` on that artifact.
  - [ ] Add an anomaly branch that requires classification + corrective action before returning to nominal monitoring.
  - [ ] Safety note: include escalation and fail-safe handling when anomalies imply security/electrical/operational risk, then require follow-up verification.
- `devops/monitoring`
  - [ ] Split `devops/monitoring` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `devops/pi-cluster-hardware`
  - [ ] Split `devops/pi-cluster-hardware` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `devops/prepare-first-node`
  - [ ] Split `devops/prepare-first-node` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `devops/private-registry`
  - [ ] Split `devops/private-registry` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `devops/ssd-boot`
  - [ ] Split `devops/ssd-boot` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `devops/ssh-hardening`
  - [ ] Split `devops/ssh-hardening` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.

### electronics (22 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): sysadmin/basic-commands, hydroponics/nutrient-check (fallback: no checked electronics quests yet)

- `electronics/arduino-blink`
  - [ ] Split `electronics/arduino-blink` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `electronics/basic-circuit`
  - [ ] Split `electronics/basic-circuit` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `electronics/check-battery-voltage`
  - [ ] Require `electronics/check-battery-voltage` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Safety note: set stop thresholds for unsafe readings and require pause/escalation until follow-up measurements return to a safe range.
- `electronics/continuity-test`
  - [ ] Require `electronics/continuity-test` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Safety note: set stop thresholds for unsafe readings and require pause/escalation until follow-up measurements return to a safe range.
- `electronics/data-logger`
  - [ ] Split `electronics/data-logger` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `electronics/desolder-component`
  - [ ] Split `electronics/desolder-component` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `electronics/led-polarity`
  - [ ] Split `electronics/led-polarity` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `electronics/light-sensor`
  - [ ] Split `electronics/light-sensor` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `electronics/measure-arduino-5v`
  - [ ] Require `electronics/measure-arduino-5v` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Safety note: set stop thresholds for unsafe readings and require pause/escalation until follow-up measurements return to a safe range.
- `electronics/measure-led-current`
  - [ ] Require `electronics/measure-led-current` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Safety note: set stop thresholds for unsafe readings and require pause/escalation until follow-up measurements return to a safe range.
- `electronics/measure-resistance`
  - [ ] Require `electronics/measure-resistance` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Safety note: set stop thresholds for unsafe readings and require pause/escalation until follow-up measurements return to a safe range.
- `electronics/potentiometer-dimmer`
  - [ ] Split `electronics/potentiometer-dimmer` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `electronics/resistor-color-check`
  - [ ] Require `electronics/resistor-color-check` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Safety note: set stop thresholds for unsafe readings and require pause/escalation until follow-up measurements return to a safe range.
- `electronics/servo-sweep`
  - [ ] Split `electronics/servo-sweep` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `electronics/solder-led-harness`
  - [ ] Split `electronics/solder-led-harness` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `electronics/solder-wire`
  - [ ] Split `electronics/solder-wire` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `electronics/soldering-intro`
  - [ ] Split `electronics/soldering-intro` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `electronics/temperature-plot`
  - [ ] Split `electronics/temperature-plot` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `electronics/test-gfci-outlet`
  - [ ] Require `electronics/test-gfci-outlet` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Safety note: set stop thresholds for unsafe readings and require pause/escalation until follow-up measurements return to a safe range.
- `electronics/thermistor-reading`
  - [ ] Split `electronics/thermistor-reading` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `electronics/thermometer-calibration`
  - [ ] Convert `electronics/thermometer-calibration` to baseline → adjust → re-test, with an explicit tolerance target that gates completion.
  - [ ] Attach mechanics-backed artifacts to each phase (baseline capture, adjustment action, and post-adjust verification).
  - [ ] Safety note: if tuned values drift, force rollback to last-known-safe settings before another adjustment pass.
- `electronics/voltage-divider`
  - [ ] Require `electronics/voltage-divider` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Safety note: set stop thresholds for unsafe readings and require pause/escalation until follow-up measurements return to a safe range.

### energy (11 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): hydroponics/nutrient-check, sysadmin/resource-monitoring (fallback: no checked energy quests yet)

- `energy/battery-maintenance`
  - [ ] Define acceptance criteria for `energy/battery-maintenance` monitoring output (required fields, cadence, and threshold bounds) and gate `finish` on that artifact.
  - [ ] Add an anomaly branch that requires classification + corrective action before returning to nominal monitoring.
  - [ ] Safety note: include escalation and fail-safe handling when anomalies imply security/electrical/operational risk, then require follow-up verification.
- `energy/battery-upgrade`
  - [ ] Split `energy/battery-upgrade` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `energy/biogas-digester`
  - [ ] Split `energy/biogas-digester` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `energy/charge-controller-setup`
  - [ ] Structure `energy/charge-controller-setup` as install → verify → rollback, with `finish` gated by a post-change artifact (status output, config diff, or expected-state item).
  - [ ] Make verification explicit in mechanics: capture a process/log artifact and add an interpretation node that confirms the change works under normal conditions.
  - [ ] Safety note: add lockout-avoidance rollback steps (backup path, safe defaults, and re-entry checks) before any retry after failed verification.
- `energy/hand-crank-generator`
  - [ ] Split `energy/hand-crank-generator` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `energy/offgrid-charger`
  - [ ] Split `energy/offgrid-charger` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `energy/portable-solar-panel`
  - [ ] Split `energy/portable-solar-panel` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `energy/power-inverter`
  - [ ] Split `energy/power-inverter` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `energy/solar-tracker`
  - [ ] Split `energy/solar-tracker` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `energy/solar`
  - [ ] Split `energy/solar` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `energy/wind-turbine`
  - [ ] Split `energy/wind-turbine` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.

### firstaid (13 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): composting/start, welcome/howtodoquests (fallback: no checked firstaid quests yet)

- `firstaid/assemble-kit`
  - [ ] Split `firstaid/assemble-kit` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `firstaid/change-bandage`
  - [ ] Split `firstaid/change-bandage` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `firstaid/dispose-bandages`
  - [ ] Split `firstaid/dispose-bandages` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `firstaid/dispose-expired`
  - [ ] Split `firstaid/dispose-expired` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `firstaid/flashlight-battery`
  - [ ] Split `firstaid/flashlight-battery` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `firstaid/learn-cpr`
  - [ ] Split `firstaid/learn-cpr` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `firstaid/remove-splinter`
  - [ ] Split `firstaid/remove-splinter` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `firstaid/restock-kit`
  - [ ] Split `firstaid/restock-kit` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `firstaid/sanitize-pocket-mask`
  - [ ] Split `firstaid/sanitize-pocket-mask` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `firstaid/splint-limb`
  - [ ] Split `firstaid/splint-limb` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `firstaid/stop-nosebleed`
  - [ ] Split `firstaid/stop-nosebleed` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `firstaid/treat-burn`
  - [ ] Split `firstaid/treat-burn` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `firstaid/wound-care`
  - [ ] Split `firstaid/wound-care` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.

### geothermal (15 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): hydroponics/nutrient-check, sysadmin/resource-monitoring (fallback: no checked geothermal quests yet)

- `geothermal/backflush-loop-filter`
  - [ ] Split `geothermal/backflush-loop-filter` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `backflush loop filter` that records failure signals, recovery actions, and a verification retry.
- `geothermal/calibrate-ground-sensor`
  - [ ] Convert `geothermal/calibrate-ground-sensor` to baseline → adjust → re-test, with an explicit tolerance target that gates completion.
  - [ ] Attach mechanics-backed artifacts to each phase (baseline capture, adjustment action, and post-adjust verification).
  - [ ] Add a drift branch: if results do not hold after a short interval, route to diagnosis and repeat the loop.
- `geothermal/check-loop-inlet-temp`
  - [ ] Require `geothermal/check-loop-inlet-temp` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Require baseline + follow-up readings so players evaluate trend direction, not a single isolated number.
- `geothermal/check-loop-outlet-temp`
  - [ ] Require `geothermal/check-loop-outlet-temp` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Require baseline + follow-up readings so players evaluate trend direction, not a single isolated number.
- `geothermal/check-loop-pressure`
  - [ ] Require `geothermal/check-loop-pressure` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Require baseline + follow-up readings so players evaluate trend direction, not a single isolated number.
- `geothermal/check-loop-temp-delta`
  - [ ] Require `geothermal/check-loop-temp-delta` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Require baseline + follow-up readings so players evaluate trend direction, not a single isolated number.
- `geothermal/compare-depth-ground-temps`
  - [ ] Split `geothermal/compare-depth-ground-temps` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `compare depth ground temps` that records failure signals, recovery actions, and a verification retry.
- `geothermal/compare-seasonal-ground-temps`
  - [ ] Split `geothermal/compare-seasonal-ground-temps` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `compare seasonal ground temps` that records failure signals, recovery actions, and a verification retry.
- `geothermal/install-backup-thermistor`
  - [ ] Structure `geothermal/install-backup-thermistor` as install → verify → rollback, with `finish` gated by a post-change artifact (status output, config diff, or expected-state item).
  - [ ] Make verification explicit in mechanics: capture a process/log artifact and add an interpretation node that confirms the change works under normal conditions.
  - [ ] Add a failed-verify branch for `install backup thermistor` that forces rollback, then reruns verification before success can resume.
- `geothermal/log-ground-temperature`
  - [ ] Define acceptance criteria for `geothermal/log-ground-temperature` monitoring output (required fields, cadence, and threshold bounds) and gate `finish` on that artifact.
  - [ ] Add an anomaly branch that requires classification + corrective action before returning to nominal monitoring.
  - [ ] Require a follow-up verification window after correction (fresh log slice or monitor snapshot) before closure.
- `geothermal/log-heat-pump-warmup`
  - [ ] Define acceptance criteria for `geothermal/log-heat-pump-warmup` monitoring output (required fields, cadence, and threshold bounds) and gate `finish` on that artifact.
  - [ ] Add an anomaly branch that requires classification + corrective action before returning to nominal monitoring.
  - [ ] Require a follow-up verification window after correction (fresh log slice or monitor snapshot) before closure.
- `geothermal/monitor-heat-pump-energy`
  - [ ] Define acceptance criteria for `geothermal/monitor-heat-pump-energy` monitoring output (required fields, cadence, and threshold bounds) and gate `finish` on that artifact.
  - [ ] Add an anomaly branch that requires classification + corrective action before returning to nominal monitoring.
  - [ ] Require a follow-up verification window after correction (fresh log slice or monitor snapshot) before closure.
- `geothermal/purge-loop-air`
  - [ ] Define before/after condition checks in `geothermal/purge-loop-air` so “clean” is measurable (residue, flow, clarity, signal quality, etc.).
  - [ ] Gate completion on paired mechanics-backed artifacts (pre-clean state + post-clean state), not narration alone.
  - [ ] Add a contamination/failure branch with a safe re-entry checkpoint, then loop until after-check criteria pass.
- `geothermal/replace-faulty-thermistor`
  - [ ] Split `geothermal/replace-faulty-thermistor` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `replace faulty thermistor` that records failure signals, recovery actions, and a verification retry.
- `geothermal/survey-ground-temperature`
  - [ ] Split `geothermal/survey-ground-temperature` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `survey ground temperature` that records failure signals, recovery actions, and a verification retry.

### hydroponics (21 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): hydroponics/basil, hydroponics/nutrient-check

- `hydroponics/air-stone-soak`
  - [ ] Split `hydroponics/air-stone-soak` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `air stone soak` that records failure signals, recovery actions, and a verification retry.
- `hydroponics/bucket_10`
  - [ ] Split `hydroponics/bucket_10` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `bucket_10` that records failure signals, recovery actions, and a verification retry.
- `hydroponics/ec-calibrate`
  - [ ] Require `hydroponics/ec-calibrate` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Require baseline + follow-up readings so players evaluate trend direction, not a single isolated number.
- `hydroponics/ec-check`
  - [ ] Require `hydroponics/ec-check` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Require baseline + follow-up readings so players evaluate trend direction, not a single isolated number.
- `hydroponics/filter-clean`
  - [ ] Define before/after condition checks in `hydroponics/filter-clean` so “clean” is measurable (residue, flow, clarity, signal quality, etc.).
  - [ ] Gate completion on paired mechanics-backed artifacts (pre-clean state + post-clean state), not narration alone.
  - [ ] Add a contamination/failure branch with a safe re-entry checkpoint, then loop until after-check criteria pass.
- `hydroponics/grow-light`
  - [ ] Split `hydroponics/grow-light` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `grow light` that records failure signals, recovery actions, and a verification retry.
- `hydroponics/lettuce`
  - [ ] Stage `hydroponics/lettuce` with two proofs: setup artifact first, then lifecycle/outcome artifact later; require both before `finish`.
  - [ ] Add a contingency branch for stress/failure signs with concrete corrective actions and a timed re-check checkpoint.
  - [ ] Include pause/abort criteria so progression halts when outcomes regress and resumes only after recovery evidence.
- `hydroponics/mint-cutting`
  - [ ] Stage `hydroponics/mint-cutting` with two proofs: setup artifact first, then lifecycle/outcome artifact later; require both before `finish`.
  - [ ] Add a contingency branch for stress/failure signs with concrete corrective actions and a timed re-check checkpoint.
  - [ ] Include pause/abort criteria so progression halts when outcomes regress and resumes only after recovery evidence.
- `hydroponics/netcup-clean`
  - [ ] Define before/after condition checks in `hydroponics/netcup-clean` so “clean” is measurable (residue, flow, clarity, signal quality, etc.).
  - [ ] Gate completion on paired mechanics-backed artifacts (pre-clean state + post-clean state), not narration alone.
  - [ ] Add a contamination/failure branch with a safe re-entry checkpoint, then loop until after-check criteria pass.
- `hydroponics/ph-check`
  - [ ] Require `hydroponics/ph-check` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Require baseline + follow-up readings so players evaluate trend direction, not a single isolated number.
- `hydroponics/ph-test`
  - [ ] Require `hydroponics/ph-test` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Require baseline + follow-up readings so players evaluate trend direction, not a single isolated number.
- `hydroponics/plug-soak`
  - [ ] Split `hydroponics/plug-soak` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `plug soak` that records failure signals, recovery actions, and a verification retry.
- `hydroponics/pump-install`
  - [ ] Structure `hydroponics/pump-install` as install → verify → rollback, with `finish` gated by a post-change artifact (status output, config diff, or expected-state item).
  - [ ] Make verification explicit in mechanics: capture a process/log artifact and add an interpretation node that confirms the change works under normal conditions.
  - [ ] Add a failed-verify branch for `pump install` that forces rollback, then reruns verification before success can resume.
- `hydroponics/pump-prime`
  - [ ] Define before/after condition checks in `hydroponics/pump-prime` so “clean” is measurable (residue, flow, clarity, signal quality, etc.).
  - [ ] Gate completion on paired mechanics-backed artifacts (pre-clean state + post-clean state), not narration alone.
  - [ ] Add a contamination/failure branch with a safe re-entry checkpoint, then loop until after-check criteria pass.
- `hydroponics/regrow-stevia`
  - [ ] Stage `hydroponics/regrow-stevia` with two proofs: setup artifact first, then lifecycle/outcome artifact later; require both before `finish`.
  - [ ] Add a contingency branch for stress/failure signs with concrete corrective actions and a timed re-check checkpoint.
  - [ ] Include pause/abort criteria so progression halts when outcomes regress and resumes only after recovery evidence.
- `hydroponics/reservoir-refresh`
  - [ ] Split `hydroponics/reservoir-refresh` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `reservoir refresh` that records failure signals, recovery actions, and a verification retry.
- `hydroponics/root-rinse`
  - [ ] Define before/after condition checks in `hydroponics/root-rinse` so “clean” is measurable (residue, flow, clarity, signal quality, etc.).
  - [ ] Gate completion on paired mechanics-backed artifacts (pre-clean state + post-clean state), not narration alone.
  - [ ] Add a contamination/failure branch with a safe re-entry checkpoint, then loop until after-check criteria pass.
- `hydroponics/stevia`
  - [ ] Stage `hydroponics/stevia` with two proofs: setup artifact first, then lifecycle/outcome artifact later; require both before `finish`.
  - [ ] Add a contingency branch for stress/failure signs with concrete corrective actions and a timed re-check checkpoint.
  - [ ] Include pause/abort criteria so progression halts when outcomes regress and resumes only after recovery evidence.
- `hydroponics/temp-check`
  - [ ] Require `hydroponics/temp-check` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Require baseline + follow-up readings so players evaluate trend direction, not a single isolated number.
- `hydroponics/top-off`
  - [ ] Split `hydroponics/top-off` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `top off` that records failure signals, recovery actions, and a verification retry.
- `hydroponics/tub-scrub`
  - [ ] Define before/after condition checks in `hydroponics/tub-scrub` so “clean” is measurable (residue, flow, clarity, signal quality, etc.).
  - [ ] Gate completion on paired mechanics-backed artifacts (pre-clean state + post-clean state), not narration alone.
  - [ ] Add a contamination/failure branch with a safe re-entry checkpoint, then loop until after-check criteria pass.

### programming (18 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): sysadmin/basic-commands, welcome/run-tests (fallback: no checked programming quests yet)

- `programming/avg-temp`
  - [ ] Require `programming/avg-temp` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Require baseline + follow-up readings so players evaluate trend direction, not a single isolated number.
- `programming/graph-temp-data`
  - [ ] Require `programming/graph-temp-data` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Require baseline + follow-up readings so players evaluate trend direction, not a single isolated number.
- `programming/graph-temp`
  - [ ] Require `programming/graph-temp` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Require baseline + follow-up readings so players evaluate trend direction, not a single isolated number.
- `programming/hello-sensor`
  - [ ] Split `programming/hello-sensor` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `hello sensor` that records failure signals, recovery actions, and a verification retry.
- `programming/http-post`
  - [ ] Split `programming/http-post` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `http post` that records failure signals, recovery actions, and a verification retry.
- `programming/json-api`
  - [ ] Split `programming/json-api` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `json api` that records failure signals, recovery actions, and a verification retry.
- `programming/json-endpoint`
  - [ ] Split `programming/json-endpoint` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `json endpoint` that records failure signals, recovery actions, and a verification retry.
- `programming/median-temp`
  - [ ] Require `programming/median-temp` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Require baseline + follow-up readings so players evaluate trend direction, not a single isolated number.
- `programming/moving-avg-temp`
  - [ ] Require `programming/moving-avg-temp` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Require baseline + follow-up readings so players evaluate trend direction, not a single isolated number.
- `programming/plot-temp-cli`
  - [ ] Require `programming/plot-temp-cli` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Require baseline + follow-up readings so players evaluate trend direction, not a single isolated number.
- `programming/stddev-temp`
  - [ ] Require `programming/stddev-temp` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Require baseline + follow-up readings so players evaluate trend direction, not a single isolated number.
- `programming/temp-alert`
  - [ ] Require `programming/temp-alert` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Require baseline + follow-up readings so players evaluate trend direction, not a single isolated number.
- `programming/temp-email`
  - [ ] Require `programming/temp-email` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Require baseline + follow-up readings so players evaluate trend direction, not a single isolated number.
- `programming/temp-graph`
  - [ ] Require `programming/temp-graph` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Require baseline + follow-up readings so players evaluate trend direction, not a single isolated number.
- `programming/temp-json-api`
  - [ ] Require `programming/temp-json-api` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Require baseline + follow-up readings so players evaluate trend direction, not a single isolated number.
- `programming/temp-logger`
  - [ ] Require `programming/temp-logger` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Require baseline + follow-up readings so players evaluate trend direction, not a single isolated number.
- `programming/thermistor-calibration`
  - [ ] Convert `programming/thermistor-calibration` to baseline → adjust → re-test, with an explicit tolerance target that gates completion.
  - [ ] Attach mechanics-backed artifacts to each phase (baseline capture, adjustment action, and post-adjust verification).
  - [ ] Add a drift branch: if results do not hold after a short interval, route to diagnosis and repeat the loop.
- `programming/web-server`
  - [ ] Split `programming/web-server` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `web server` that records failure signals, recovery actions, and a verification retry.

### robotics (13 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): sysadmin/basic-commands, hydroponics/nutrient-check (fallback: no checked robotics quests yet)

- `robotics/gyro-balance`
  - [ ] Split `robotics/gyro-balance` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `gyro balance` that records failure signals, recovery actions, and a verification retry.
- `robotics/line-follower`
  - [ ] Split `robotics/line-follower` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `line follower` that records failure signals, recovery actions, and a verification retry.
- `robotics/maze-navigation`
  - [ ] Split `robotics/maze-navigation` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `maze navigation` that records failure signals, recovery actions, and a verification retry.
- `robotics/obstacle-avoidance`
  - [ ] Split `robotics/obstacle-avoidance` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `obstacle avoidance` that records failure signals, recovery actions, and a verification retry.
- `robotics/odometry-basics`
  - [ ] Split `robotics/odometry-basics` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `odometry basics` that records failure signals, recovery actions, and a verification retry.
- `robotics/pan-tilt`
  - [ ] Split `robotics/pan-tilt` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `pan tilt` that records failure signals, recovery actions, and a verification retry.
- `robotics/reflectance-sensors`
  - [ ] Split `robotics/reflectance-sensors` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `reflectance sensors` that records failure signals, recovery actions, and a verification retry.
- `robotics/servo-arm`
  - [ ] Split `robotics/servo-arm` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `servo arm` that records failure signals, recovery actions, and a verification retry.
- `robotics/servo-control`
  - [ ] Split `robotics/servo-control` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `servo control` that records failure signals, recovery actions, and a verification retry.
- `robotics/servo-gripper`
  - [ ] Split `robotics/servo-gripper` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `servo gripper` that records failure signals, recovery actions, and a verification retry.
- `robotics/servo-radar`
  - [ ] Split `robotics/servo-radar` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `servo radar` that records failure signals, recovery actions, and a verification retry.
- `robotics/ultrasonic-rangefinder`
  - [ ] Split `robotics/ultrasonic-rangefinder` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `ultrasonic rangefinder` that records failure signals, recovery actions, and a verification retry.
- `robotics/wheel-encoders`
  - [ ] Split `robotics/wheel-encoders` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `wheel encoders` that records failure signals, recovery actions, and a verification retry.

### rocketry (10 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): composting/start, sysadmin/resource-monitoring (fallback: no checked rocketry quests yet)

- `rocketry/firstlaunch`
  - [ ] Split `rocketry/firstlaunch` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `rocketry/fuel-mixture`
  - [ ] Split `rocketry/fuel-mixture` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `rocketry/guided-rocket-build`
  - [ ] Split `rocketry/guided-rocket-build` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `rocketry/night-launch`
  - [ ] Split `rocketry/night-launch` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `rocketry/parachute`
  - [ ] Split `rocketry/parachute` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `rocketry/preflight-check`
  - [ ] Require `rocketry/preflight-check` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Safety note: set stop thresholds for unsafe readings and require pause/escalation until follow-up measurements return to a safe range.
- `rocketry/recovery-run`
  - [ ] Split `rocketry/recovery-run` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `rocketry/static-test`
  - [ ] Require `rocketry/static-test` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Safety note: set stop thresholds for unsafe readings and require pause/escalation until follow-up measurements return to a safe range.
- `rocketry/suborbital-hop`
  - [ ] Split `rocketry/suborbital-hop` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Safety note: add risk-aware recovery steps (safe stop, rollback, re-entry verification) before retries.
- `rocketry/wind-check`
  - [ ] Require `rocketry/wind-check` to record a measurement artifact and pass through an interpretation node before `finish` unlocks.
  - [ ] Add an out-of-range branch with corrective action (adjust, replace, or stabilize) and a mandatory re-test loop.
  - [ ] Safety note: set stop thresholds for unsafe readings and require pause/escalation until follow-up measurements return to a safe range.

### ubi (3 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): ubi/basicincome

- `ubi/first-payment`
  - [ ] Split `ubi/first-payment` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `first payment` that records failure signals, recovery actions, and a verification retry.
- `ubi/reminder`
  - [ ] Split `ubi/reminder` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `reminder` that records failure signals, recovery actions, and a verification retry.
- `ubi/savings-goal`
  - [ ] Split `ubi/savings-goal` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `savings goal` that records failure signals, recovery actions, and a verification retry.

### woodworking (10 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): 3dprinting/start, welcome/intro-inventory (fallback: no checked woodworking quests yet)

- `woodworking/apply-finish`
  - [ ] Split `woodworking/apply-finish` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `apply finish` that records failure signals, recovery actions, and a verification retry.
- `woodworking/birdhouse`
  - [ ] Split `woodworking/birdhouse` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `birdhouse` that records failure signals, recovery actions, and a verification retry.
- `woodworking/bookshelf`
  - [ ] Split `woodworking/bookshelf` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `bookshelf` that records failure signals, recovery actions, and a verification retry.
- `woodworking/coffee-table`
  - [ ] Split `woodworking/coffee-table` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `coffee table` that records failure signals, recovery actions, and a verification retry.
- `woodworking/finish-sanding`
  - [ ] Split `woodworking/finish-sanding` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `finish sanding` that records failure signals, recovery actions, and a verification retry.
- `woodworking/picture-frame`
  - [ ] Split `woodworking/picture-frame` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `picture frame` that records failure signals, recovery actions, and a verification retry.
- `woodworking/planter-box`
  - [ ] Split `woodworking/planter-box` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `planter box` that records failure signals, recovery actions, and a verification retry.
- `woodworking/step-stool`
  - [ ] Split `woodworking/step-stool` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `step stool` that records failure signals, recovery actions, and a verification retry.
- `woodworking/tool-rack`
  - [ ] Split `woodworking/tool-rack` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `tool rack` that records failure signals, recovery actions, and a verification retry.
- `woodworking/workbench`
  - [ ] Split `woodworking/workbench` into a primary path and an alternate strategy path so the player makes a meaningful progression decision.
  - [ ] Gate completion on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or resulting log/result item) with a short interpretation checkpoint.
  - [ ] Add a troubleshooting branch for `workbench` that records failure signals, recovery actions, and a verification retry.

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
