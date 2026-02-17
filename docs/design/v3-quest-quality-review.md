# v3 quest quality review: manual QA signal vs newly added quest content

## Why this doc exists

The v3 QA checklist already has a quest-by-quest validation list in
`docs/qa/v3.md` §4.5. At the time of writing, only 16 quests are checked, while 221 remain unchecked.
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

This backlog enumerates every **new in v3** quest that is still unchecked against the
manual QA quality bar. These entries should be brought to parity with the validated
exemplars by adding deeper mechanics, failure handling, and evidence-based gates.

- Total new-in-v3 quests: **225**
- Already manually checked exemplars in v3: **12**
- Remaining problematic quests to prioritize: **213**

### 3dprinting (12 quests)

- `3dprinting/bed-leveling`
  - [ ] Add a calibration/diagnostic checkpoint before final completion (bed, flow, or temp proof).
  - [ ] Add a branch for a common print failure mode with a recovery loop.
  - [ ] Require one process- or item-backed artifact (test print, measurement, or photo log).

- `3dprinting/blob-of-death`
  - [ ] Add a calibration/diagnostic checkpoint before final completion (bed, flow, or temp proof).
  - [ ] Add a branch for a common print failure mode with a recovery loop.
  - [ ] Require one process- or item-backed artifact (test print, measurement, or photo log).

- `3dprinting/cable-clip`
  - [ ] Add a calibration/diagnostic checkpoint before final completion (bed, flow, or temp proof).
  - [ ] Add a branch for a common print failure mode with a recovery loop.
  - [ ] Require one process- or item-backed artifact (test print, measurement, or photo log).

- `3dprinting/calibration-cube`
  - [ ] Add a calibration/diagnostic checkpoint before final completion (bed, flow, or temp proof).
  - [ ] Add a branch for a common print failure mode with a recovery loop.
  - [ ] Require one process- or item-backed artifact (test print, measurement, or photo log).
  - [ ] Add explicit before/after calibration readings and acceptable error bounds.

- `3dprinting/filament-change`
  - [ ] Add a calibration/diagnostic checkpoint before final completion (bed, flow, or temp proof).
  - [ ] Add a branch for a common print failure mode with a recovery loop.
  - [ ] Require one process- or item-backed artifact (test print, measurement, or photo log).

- `3dprinting/nozzle-cleaning`
  - [ ] Add a calibration/diagnostic checkpoint before final completion (bed, flow, or temp proof).
  - [ ] Add a branch for a common print failure mode with a recovery loop.
  - [ ] Require one process- or item-backed artifact (test print, measurement, or photo log).

- `3dprinting/nozzle-clog`
  - [ ] Add a calibration/diagnostic checkpoint before final completion (bed, flow, or temp proof).
  - [ ] Add a branch for a common print failure mode with a recovery loop.
  - [ ] Require one process- or item-backed artifact (test print, measurement, or photo log).

- `3dprinting/phone-stand`
  - [ ] Add a calibration/diagnostic checkpoint before final completion (bed, flow, or temp proof).
  - [ ] Add a branch for a common print failure mode with a recovery loop.
  - [ ] Require one process- or item-backed artifact (test print, measurement, or photo log).

- `3dprinting/retraction-test`
  - [ ] Add a calibration/diagnostic checkpoint before final completion (bed, flow, or temp proof).
  - [ ] Add a branch for a common print failure mode with a recovery loop.
  - [ ] Require one process- or item-backed artifact (test print, measurement, or photo log).

- `3dprinting/spool-holder`
  - [ ] Add a calibration/diagnostic checkpoint before final completion (bed, flow, or temp proof).
  - [ ] Add a branch for a common print failure mode with a recovery loop.
  - [ ] Require one process- or item-backed artifact (test print, measurement, or photo log).

- `3dprinting/temperature-tower`
  - [ ] Add a calibration/diagnostic checkpoint before final completion (bed, flow, or temp proof).
  - [ ] Add a branch for a common print failure mode with a recovery loop.
  - [ ] Require one process- or item-backed artifact (test print, measurement, or photo log).
  - [ ] Require logged measurements with target ranges and corrective loops.

- `3dprinting/x-belt-tension`
  - [ ] Add a calibration/diagnostic checkpoint before final completion (bed, flow, or temp proof).
  - [ ] Add a branch for a common print failure mode with a recovery loop.
  - [ ] Require one process- or item-backed artifact (test print, measurement, or photo log).

### aquaria (18 quests)

- `aquaria/aquarium-light`
  - [ ] Split setup, water-parameter validation, and livestock-care into gated stages.
  - [ ] Add at least one risk branch (stress signs, contamination, or equipment fault).
  - [ ] Require logged water metrics or maintenance evidence before completion.

- `aquaria/balance-ph`
  - [ ] Split setup, water-parameter validation, and livestock-care into gated stages.
  - [ ] Add at least one risk branch (stress signs, contamination, or equipment fault).
  - [ ] Require logged water metrics or maintenance evidence before completion.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `aquaria/breeding`
  - [ ] Split setup, water-parameter validation, and livestock-care into gated stages.
  - [ ] Add at least one risk branch (stress signs, contamination, or equipment fault).
  - [ ] Require logged water metrics or maintenance evidence before completion.

- `aquaria/filter-rinse`
  - [ ] Split setup, water-parameter validation, and livestock-care into gated stages.
  - [ ] Add at least one risk branch (stress signs, contamination, or equipment fault).
  - [ ] Require logged water metrics or maintenance evidence before completion.

- `aquaria/floating-plants`
  - [ ] Split setup, water-parameter validation, and livestock-care into gated stages.
  - [ ] Add at least one risk branch (stress signs, contamination, or equipment fault).
  - [ ] Require logged water metrics or maintenance evidence before completion.

- `aquaria/guppy`
  - [ ] Split setup, water-parameter validation, and livestock-care into gated stages.
  - [ ] Add at least one risk branch (stress signs, contamination, or equipment fault).
  - [ ] Require logged water metrics or maintenance evidence before completion.

- `aquaria/heater-install`
  - [ ] Split setup, water-parameter validation, and livestock-care into gated stages.
  - [ ] Add at least one risk branch (stress signs, contamination, or equipment fault).
  - [ ] Require logged water metrics or maintenance evidence before completion.

- `aquaria/log-water-parameters`
  - [ ] Split setup, water-parameter validation, and livestock-care into gated stages.
  - [ ] Add at least one risk branch (stress signs, contamination, or equipment fault).
  - [ ] Require logged water metrics or maintenance evidence before completion.

- `aquaria/net-fish`
  - [ ] Split setup, water-parameter validation, and livestock-care into gated stages.
  - [ ] Add at least one risk branch (stress signs, contamination, or equipment fault).
  - [ ] Require logged water metrics or maintenance evidence before completion.

- `aquaria/ph-strip-test`
  - [ ] Split setup, water-parameter validation, and livestock-care into gated stages.
  - [ ] Add at least one risk branch (stress signs, contamination, or equipment fault).
  - [ ] Require logged water metrics or maintenance evidence before completion.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `aquaria/position-tank`
  - [ ] Split setup, water-parameter validation, and livestock-care into gated stages.
  - [ ] Add at least one risk branch (stress signs, contamination, or equipment fault).
  - [ ] Require logged water metrics or maintenance evidence before completion.

- `aquaria/shrimp`
  - [ ] Split setup, water-parameter validation, and livestock-care into gated stages.
  - [ ] Add at least one risk branch (stress signs, contamination, or equipment fault).
  - [ ] Require logged water metrics or maintenance evidence before completion.

- `aquaria/sponge-filter`
  - [ ] Split setup, water-parameter validation, and livestock-care into gated stages.
  - [ ] Add at least one risk branch (stress signs, contamination, or equipment fault).
  - [ ] Require logged water metrics or maintenance evidence before completion.

- `aquaria/thermometer`
  - [ ] Split setup, water-parameter validation, and livestock-care into gated stages.
  - [ ] Add at least one risk branch (stress signs, contamination, or equipment fault).
  - [ ] Require logged water metrics or maintenance evidence before completion.

- `aquaria/top-off`
  - [ ] Split setup, water-parameter validation, and livestock-care into gated stages.
  - [ ] Add at least one risk branch (stress signs, contamination, or equipment fault).
  - [ ] Require logged water metrics or maintenance evidence before completion.

- `aquaria/walstad`
  - [ ] Split setup, water-parameter validation, and livestock-care into gated stages.
  - [ ] Add at least one risk branch (stress signs, contamination, or equipment fault).
  - [ ] Require logged water metrics or maintenance evidence before completion.

- `aquaria/water-change`
  - [ ] Split setup, water-parameter validation, and livestock-care into gated stages.
  - [ ] Add at least one risk branch (stress signs, contamination, or equipment fault).
  - [ ] Require logged water metrics or maintenance evidence before completion.

- `aquaria/water-testing`
  - [ ] Split setup, water-parameter validation, and livestock-care into gated stages.
  - [ ] Add at least one risk branch (stress signs, contamination, or equipment fault).
  - [ ] Require logged water metrics or maintenance evidence before completion.

### astronomy (21 quests)

- `astronomy/andromeda`
  - [ ] Add fallback branches for weather, light pollution, or seeing conditions.
  - [ ] Require an observation artifact (log, sketch, or timed pass capture).
  - [ ] Add troubleshooting prompts for alignment/focus before finish.

- `astronomy/aurora-watch`
  - [ ] Add fallback branches for weather, light pollution, or seeing conditions.
  - [ ] Require an observation artifact (log, sketch, or timed pass capture).
  - [ ] Add troubleshooting prompts for alignment/focus before finish.

- `astronomy/basic-telescope`
  - [ ] Add fallback branches for weather, light pollution, or seeing conditions.
  - [ ] Require an observation artifact (log, sketch, or timed pass capture).
  - [ ] Add troubleshooting prompts for alignment/focus before finish.

- `astronomy/binary-star`
  - [ ] Add fallback branches for weather, light pollution, or seeing conditions.
  - [ ] Require an observation artifact (log, sketch, or timed pass capture).
  - [ ] Add troubleshooting prompts for alignment/focus before finish.

- `astronomy/comet-tracking`
  - [ ] Add fallback branches for weather, light pollution, or seeing conditions.
  - [ ] Require an observation artifact (log, sketch, or timed pass capture).
  - [ ] Add troubleshooting prompts for alignment/focus before finish.

- `astronomy/constellations`
  - [ ] Add fallback branches for weather, light pollution, or seeing conditions.
  - [ ] Require an observation artifact (log, sketch, or timed pass capture).
  - [ ] Add troubleshooting prompts for alignment/focus before finish.

- `astronomy/iss-flyover`
  - [ ] Add fallback branches for weather, light pollution, or seeing conditions.
  - [ ] Require an observation artifact (log, sketch, or timed pass capture).
  - [ ] Add troubleshooting prompts for alignment/focus before finish.

- `astronomy/iss-photo`
  - [ ] Add fallback branches for weather, light pollution, or seeing conditions.
  - [ ] Require an observation artifact (log, sketch, or timed pass capture).
  - [ ] Add troubleshooting prompts for alignment/focus before finish.

- `astronomy/jupiter-moons`
  - [ ] Add fallback branches for weather, light pollution, or seeing conditions.
  - [ ] Require an observation artifact (log, sketch, or timed pass capture).
  - [ ] Add troubleshooting prompts for alignment/focus before finish.

- `astronomy/light-pollution`
  - [ ] Add fallback branches for weather, light pollution, or seeing conditions.
  - [ ] Require an observation artifact (log, sketch, or timed pass capture).
  - [ ] Add troubleshooting prompts for alignment/focus before finish.

- `astronomy/lunar-eclipse`
  - [ ] Add fallback branches for weather, light pollution, or seeing conditions.
  - [ ] Require an observation artifact (log, sketch, or timed pass capture).
  - [ ] Add troubleshooting prompts for alignment/focus before finish.

- `astronomy/meteor-shower`
  - [ ] Add fallback branches for weather, light pollution, or seeing conditions.
  - [ ] Require an observation artifact (log, sketch, or timed pass capture).
  - [ ] Add troubleshooting prompts for alignment/focus before finish.

- `astronomy/north-star`
  - [ ] Add fallback branches for weather, light pollution, or seeing conditions.
  - [ ] Require an observation artifact (log, sketch, or timed pass capture).
  - [ ] Add troubleshooting prompts for alignment/focus before finish.

- `astronomy/observe-moon`
  - [ ] Add fallback branches for weather, light pollution, or seeing conditions.
  - [ ] Require an observation artifact (log, sketch, or timed pass capture).
  - [ ] Add troubleshooting prompts for alignment/focus before finish.

- `astronomy/orion-nebula`
  - [ ] Add fallback branches for weather, light pollution, or seeing conditions.
  - [ ] Require an observation artifact (log, sketch, or timed pass capture).
  - [ ] Add troubleshooting prompts for alignment/focus before finish.

- `astronomy/planetary-alignment`
  - [ ] Add fallback branches for weather, light pollution, or seeing conditions.
  - [ ] Require an observation artifact (log, sketch, or timed pass capture).
  - [ ] Add troubleshooting prompts for alignment/focus before finish.

- `astronomy/satellite-pass`
  - [ ] Add fallback branches for weather, light pollution, or seeing conditions.
  - [ ] Require an observation artifact (log, sketch, or timed pass capture).
  - [ ] Add troubleshooting prompts for alignment/focus before finish.

- `astronomy/saturn-rings`
  - [ ] Add fallback branches for weather, light pollution, or seeing conditions.
  - [ ] Require an observation artifact (log, sketch, or timed pass capture).
  - [ ] Add troubleshooting prompts for alignment/focus before finish.

- `astronomy/star-trails`
  - [ ] Add fallback branches for weather, light pollution, or seeing conditions.
  - [ ] Require an observation artifact (log, sketch, or timed pass capture).
  - [ ] Add troubleshooting prompts for alignment/focus before finish.

- `astronomy/sunspot-sketch`
  - [ ] Add fallback branches for weather, light pollution, or seeing conditions.
  - [ ] Require an observation artifact (log, sketch, or timed pass capture).
  - [ ] Add troubleshooting prompts for alignment/focus before finish.

- `astronomy/venus-phases`
  - [ ] Add fallback branches for weather, light pollution, or seeing conditions.
  - [ ] Require an observation artifact (log, sketch, or timed pass capture).
  - [ ] Add troubleshooting prompts for alignment/focus before finish.

### chemistry (10 quests)

- `chemistry/acid-dilution`
  - [ ] Gate completion on explicit safety sequence and PPE checks.
  - [ ] Require measurement evidence (pH, volume, concentration, or yield).
  - [ ] Add a branch for off-target outcomes with corrective action.

- `chemistry/acid-neutralization`
  - [ ] Gate completion on explicit safety sequence and PPE checks.
  - [ ] Require measurement evidence (pH, volume, concentration, or yield).
  - [ ] Add a branch for off-target outcomes with corrective action.

- `chemistry/buffer-solution`
  - [ ] Gate completion on explicit safety sequence and PPE checks.
  - [ ] Require measurement evidence (pH, volume, concentration, or yield).
  - [ ] Add a branch for off-target outcomes with corrective action.

- `chemistry/ph-adjustment`
  - [ ] Gate completion on explicit safety sequence and PPE checks.
  - [ ] Require measurement evidence (pH, volume, concentration, or yield).
  - [ ] Add a branch for off-target outcomes with corrective action.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `chemistry/ph-test`
  - [ ] Gate completion on explicit safety sequence and PPE checks.
  - [ ] Require measurement evidence (pH, volume, concentration, or yield).
  - [ ] Add a branch for off-target outcomes with corrective action.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `chemistry/precipitation-reaction`
  - [ ] Gate completion on explicit safety sequence and PPE checks.
  - [ ] Require measurement evidence (pH, volume, concentration, or yield).
  - [ ] Add a branch for off-target outcomes with corrective action.

- `chemistry/safe-reaction`
  - [ ] Gate completion on explicit safety sequence and PPE checks.
  - [ ] Require measurement evidence (pH, volume, concentration, or yield).
  - [ ] Add a branch for off-target outcomes with corrective action.

- `chemistry/stevia-crystals`
  - [ ] Gate completion on explicit safety sequence and PPE checks.
  - [ ] Require measurement evidence (pH, volume, concentration, or yield).
  - [ ] Add a branch for off-target outcomes with corrective action.

- `chemistry/stevia-extraction`
  - [ ] Gate completion on explicit safety sequence and PPE checks.
  - [ ] Require measurement evidence (pH, volume, concentration, or yield).
  - [ ] Add a branch for off-target outcomes with corrective action.

- `chemistry/stevia-tasting`
  - [ ] Gate completion on explicit safety sequence and PPE checks.
  - [ ] Require measurement evidence (pH, volume, concentration, or yield).
  - [ ] Add a branch for off-target outcomes with corrective action.

### completionist (4 quests)

- `completionist/catalog`
  - [ ] Tie completion to verifiable inventory/process milestones instead of narration only.
  - [ ] Add one branch that lets players optimize order or strategy.
  - [ ] Clarify why rewards are proportional to effort and novelty.

- `completionist/display`
  - [ ] Tie completion to verifiable inventory/process milestones instead of narration only.
  - [ ] Add one branch that lets players optimize order or strategy.
  - [ ] Clarify why rewards are proportional to effort and novelty.

- `completionist/polish`
  - [ ] Tie completion to verifiable inventory/process milestones instead of narration only.
  - [ ] Add one branch that lets players optimize order or strategy.
  - [ ] Clarify why rewards are proportional to effort and novelty.

- `completionist/reminder`
  - [ ] Tie completion to verifiable inventory/process milestones instead of narration only.
  - [ ] Add one branch that lets players optimize order or strategy.
  - [ ] Clarify why rewards are proportional to effort and novelty.

### devops (15 quests)

- `devops/auto-updates`
  - [ ] Split into provision, configure, verify, and rollback checkpoints.
  - [ ] Require a concrete verification artifact (logs, status output, health check).
  - [ ] Add an outage/recovery branch to demonstrate operational resilience.

- `devops/ci-pipeline`
  - [ ] Split into provision, configure, verify, and rollback checkpoints.
  - [ ] Require a concrete verification artifact (logs, status output, health check).
  - [ ] Add an outage/recovery branch to demonstrate operational resilience.

- `devops/daily-backups`
  - [ ] Split into provision, configure, verify, and rollback checkpoints.
  - [ ] Require a concrete verification artifact (logs, status output, health check).
  - [ ] Add an outage/recovery branch to demonstrate operational resilience.

- `devops/docker-compose`
  - [ ] Split into provision, configure, verify, and rollback checkpoints.
  - [ ] Require a concrete verification artifact (logs, status output, health check).
  - [ ] Add an outage/recovery branch to demonstrate operational resilience.

- `devops/enable-https`
  - [ ] Split into provision, configure, verify, and rollback checkpoints.
  - [ ] Require a concrete verification artifact (logs, status output, health check).
  - [ ] Add an outage/recovery branch to demonstrate operational resilience.

- `devops/fail2ban`
  - [ ] Split into provision, configure, verify, and rollback checkpoints.
  - [ ] Require a concrete verification artifact (logs, status output, health check).
  - [ ] Add an outage/recovery branch to demonstrate operational resilience.

- `devops/firewall-rules`
  - [ ] Split into provision, configure, verify, and rollback checkpoints.
  - [ ] Require a concrete verification artifact (logs, status output, health check).
  - [ ] Add an outage/recovery branch to demonstrate operational resilience.

- `devops/k3s-deploy`
  - [ ] Split into provision, configure, verify, and rollback checkpoints.
  - [ ] Require a concrete verification artifact (logs, status output, health check).
  - [ ] Add an outage/recovery branch to demonstrate operational resilience.

- `devops/log-maintenance`
  - [ ] Split into provision, configure, verify, and rollback checkpoints.
  - [ ] Require a concrete verification artifact (logs, status output, health check).
  - [ ] Add an outage/recovery branch to demonstrate operational resilience.

- `devops/monitoring`
  - [ ] Split into provision, configure, verify, and rollback checkpoints.
  - [ ] Require a concrete verification artifact (logs, status output, health check).
  - [ ] Add an outage/recovery branch to demonstrate operational resilience.

- `devops/pi-cluster-hardware`
  - [ ] Split into provision, configure, verify, and rollback checkpoints.
  - [ ] Require a concrete verification artifact (logs, status output, health check).
  - [ ] Add an outage/recovery branch to demonstrate operational resilience.

- `devops/prepare-first-node`
  - [ ] Split into provision, configure, verify, and rollback checkpoints.
  - [ ] Require a concrete verification artifact (logs, status output, health check).
  - [ ] Add an outage/recovery branch to demonstrate operational resilience.

- `devops/private-registry`
  - [ ] Split into provision, configure, verify, and rollback checkpoints.
  - [ ] Require a concrete verification artifact (logs, status output, health check).
  - [ ] Add an outage/recovery branch to demonstrate operational resilience.

- `devops/ssd-boot`
  - [ ] Split into provision, configure, verify, and rollback checkpoints.
  - [ ] Require a concrete verification artifact (logs, status output, health check).
  - [ ] Add an outage/recovery branch to demonstrate operational resilience.

- `devops/ssh-hardening`
  - [ ] Split into provision, configure, verify, and rollback checkpoints.
  - [ ] Require a concrete verification artifact (logs, status output, health check).
  - [ ] Add an outage/recovery branch to demonstrate operational resilience.

### electronics (22 quests)

- `electronics/arduino-blink`
  - [ ] Add instrument-backed validation (voltage/current/resistance) before finish.
  - [ ] Introduce a fault-isolation branch (polarity, continuity, or component failure).
  - [ ] Require a build-quality or safety confirmation gate.

- `electronics/basic-circuit`
  - [ ] Add instrument-backed validation (voltage/current/resistance) before finish.
  - [ ] Introduce a fault-isolation branch (polarity, continuity, or component failure).
  - [ ] Require a build-quality or safety confirmation gate.

- `electronics/check-battery-voltage`
  - [ ] Add instrument-backed validation (voltage/current/resistance) before finish.
  - [ ] Introduce a fault-isolation branch (polarity, continuity, or component failure).
  - [ ] Require a build-quality or safety confirmation gate.

- `electronics/continuity-test`
  - [ ] Add instrument-backed validation (voltage/current/resistance) before finish.
  - [ ] Introduce a fault-isolation branch (polarity, continuity, or component failure).
  - [ ] Require a build-quality or safety confirmation gate.

- `electronics/data-logger`
  - [ ] Add instrument-backed validation (voltage/current/resistance) before finish.
  - [ ] Introduce a fault-isolation branch (polarity, continuity, or component failure).
  - [ ] Require a build-quality or safety confirmation gate.

- `electronics/desolder-component`
  - [ ] Add instrument-backed validation (voltage/current/resistance) before finish.
  - [ ] Introduce a fault-isolation branch (polarity, continuity, or component failure).
  - [ ] Require a build-quality or safety confirmation gate.
  - [ ] Add quality-inspection branch for cold joints/bridges and rework validation.

- `electronics/led-polarity`
  - [ ] Add instrument-backed validation (voltage/current/resistance) before finish.
  - [ ] Introduce a fault-isolation branch (polarity, continuity, or component failure).
  - [ ] Require a build-quality or safety confirmation gate.

- `electronics/light-sensor`
  - [ ] Add instrument-backed validation (voltage/current/resistance) before finish.
  - [ ] Introduce a fault-isolation branch (polarity, continuity, or component failure).
  - [ ] Require a build-quality or safety confirmation gate.

- `electronics/measure-arduino-5v`
  - [ ] Add instrument-backed validation (voltage/current/resistance) before finish.
  - [ ] Introduce a fault-isolation branch (polarity, continuity, or component failure).
  - [ ] Require a build-quality or safety confirmation gate.

- `electronics/measure-led-current`
  - [ ] Add instrument-backed validation (voltage/current/resistance) before finish.
  - [ ] Introduce a fault-isolation branch (polarity, continuity, or component failure).
  - [ ] Require a build-quality or safety confirmation gate.

- `electronics/measure-resistance`
  - [ ] Add instrument-backed validation (voltage/current/resistance) before finish.
  - [ ] Introduce a fault-isolation branch (polarity, continuity, or component failure).
  - [ ] Require a build-quality or safety confirmation gate.

- `electronics/potentiometer-dimmer`
  - [ ] Add instrument-backed validation (voltage/current/resistance) before finish.
  - [ ] Introduce a fault-isolation branch (polarity, continuity, or component failure).
  - [ ] Require a build-quality or safety confirmation gate.

- `electronics/resistor-color-check`
  - [ ] Add instrument-backed validation (voltage/current/resistance) before finish.
  - [ ] Introduce a fault-isolation branch (polarity, continuity, or component failure).
  - [ ] Require a build-quality or safety confirmation gate.

- `electronics/servo-sweep`
  - [ ] Add instrument-backed validation (voltage/current/resistance) before finish.
  - [ ] Introduce a fault-isolation branch (polarity, continuity, or component failure).
  - [ ] Require a build-quality or safety confirmation gate.

- `electronics/solder-led-harness`
  - [ ] Add instrument-backed validation (voltage/current/resistance) before finish.
  - [ ] Introduce a fault-isolation branch (polarity, continuity, or component failure).
  - [ ] Require a build-quality or safety confirmation gate.
  - [ ] Add quality-inspection branch for cold joints/bridges and rework validation.

- `electronics/solder-wire`
  - [ ] Add instrument-backed validation (voltage/current/resistance) before finish.
  - [ ] Introduce a fault-isolation branch (polarity, continuity, or component failure).
  - [ ] Require a build-quality or safety confirmation gate.
  - [ ] Add quality-inspection branch for cold joints/bridges and rework validation.

- `electronics/soldering-intro`
  - [ ] Add instrument-backed validation (voltage/current/resistance) before finish.
  - [ ] Introduce a fault-isolation branch (polarity, continuity, or component failure).
  - [ ] Require a build-quality or safety confirmation gate.

- `electronics/temperature-plot`
  - [ ] Add instrument-backed validation (voltage/current/resistance) before finish.
  - [ ] Introduce a fault-isolation branch (polarity, continuity, or component failure).
  - [ ] Require a build-quality or safety confirmation gate.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `electronics/test-gfci-outlet`
  - [ ] Add instrument-backed validation (voltage/current/resistance) before finish.
  - [ ] Introduce a fault-isolation branch (polarity, continuity, or component failure).
  - [ ] Require a build-quality or safety confirmation gate.

- `electronics/thermistor-reading`
  - [ ] Add instrument-backed validation (voltage/current/resistance) before finish.
  - [ ] Introduce a fault-isolation branch (polarity, continuity, or component failure).
  - [ ] Require a build-quality or safety confirmation gate.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `electronics/thermometer-calibration`
  - [ ] Add instrument-backed validation (voltage/current/resistance) before finish.
  - [ ] Introduce a fault-isolation branch (polarity, continuity, or component failure).
  - [ ] Require a build-quality or safety confirmation gate.
  - [ ] Add explicit before/after calibration readings and acceptable error bounds.

- `electronics/voltage-divider`
  - [ ] Add instrument-backed validation (voltage/current/resistance) before finish.
  - [ ] Introduce a fault-isolation branch (polarity, continuity, or component failure).
  - [ ] Require a build-quality or safety confirmation gate.

### energy (11 quests)

- `energy/battery-maintenance`
  - [ ] Reduce pure grind gating by adding strategy decisions (efficiency vs throughput, storage vs spend).
  - [ ] Require process-backed proof of generation/consumption checkpoints.
  - [ ] Add at least one maintenance or failure-mode branch.

- `energy/battery-upgrade`
  - [ ] Reduce pure grind gating by adding strategy decisions (efficiency vs throughput, storage vs spend).
  - [ ] Require process-backed proof of generation/consumption checkpoints.
  - [ ] Add at least one maintenance or failure-mode branch.

- `energy/biogas-digester`
  - [ ] Reduce pure grind gating by adding strategy decisions (efficiency vs throughput, storage vs spend).
  - [ ] Require process-backed proof of generation/consumption checkpoints.
  - [ ] Add at least one maintenance or failure-mode branch.

- `energy/charge-controller-setup`
  - [ ] Reduce pure grind gating by adding strategy decisions (efficiency vs throughput, storage vs spend).
  - [ ] Require process-backed proof of generation/consumption checkpoints.
  - [ ] Add at least one maintenance or failure-mode branch.

- `energy/dWatt-1e8`
  - [ ] Reduce pure grind gating by adding strategy decisions (efficiency vs throughput, storage vs spend).
  - [ ] Require process-backed proof of generation/consumption checkpoints.
  - [ ] Add at least one maintenance or failure-mode branch.
  - [ ] Replace threshold-only progression with mixed objectives and strategy branches.

- `energy/hand-crank-generator`
  - [ ] Reduce pure grind gating by adding strategy decisions (efficiency vs throughput, storage vs spend).
  - [ ] Require process-backed proof of generation/consumption checkpoints.
  - [ ] Add at least one maintenance or failure-mode branch.

- `energy/offgrid-charger`
  - [ ] Reduce pure grind gating by adding strategy decisions (efficiency vs throughput, storage vs spend).
  - [ ] Require process-backed proof of generation/consumption checkpoints.
  - [ ] Add at least one maintenance or failure-mode branch.

- `energy/portable-solar-panel`
  - [ ] Reduce pure grind gating by adding strategy decisions (efficiency vs throughput, storage vs spend).
  - [ ] Require process-backed proof of generation/consumption checkpoints.
  - [ ] Add at least one maintenance or failure-mode branch.

- `energy/power-inverter`
  - [ ] Reduce pure grind gating by adding strategy decisions (efficiency vs throughput, storage vs spend).
  - [ ] Require process-backed proof of generation/consumption checkpoints.
  - [ ] Add at least one maintenance or failure-mode branch.

- `energy/solar-tracker`
  - [ ] Reduce pure grind gating by adding strategy decisions (efficiency vs throughput, storage vs spend).
  - [ ] Require process-backed proof of generation/consumption checkpoints.
  - [ ] Add at least one maintenance or failure-mode branch.

- `energy/wind-turbine`
  - [ ] Reduce pure grind gating by adding strategy decisions (efficiency vs throughput, storage vs spend).
  - [ ] Require process-backed proof of generation/consumption checkpoints.
  - [ ] Add at least one maintenance or failure-mode branch.

### firstaid (13 quests)

- `firstaid/assemble-kit`
  - [ ] Gate completion on correct triage order and safety constraints.
  - [ ] Add escalation branch for red-flag symptoms requiring professional care.
  - [ ] Require evidence-backed kit/process selection before completion.

- `firstaid/change-bandage`
  - [ ] Gate completion on correct triage order and safety constraints.
  - [ ] Add escalation branch for red-flag symptoms requiring professional care.
  - [ ] Require evidence-backed kit/process selection before completion.

- `firstaid/dispose-bandages`
  - [ ] Gate completion on correct triage order and safety constraints.
  - [ ] Add escalation branch for red-flag symptoms requiring professional care.
  - [ ] Require evidence-backed kit/process selection before completion.

- `firstaid/dispose-expired`
  - [ ] Gate completion on correct triage order and safety constraints.
  - [ ] Add escalation branch for red-flag symptoms requiring professional care.
  - [ ] Require evidence-backed kit/process selection before completion.

- `firstaid/flashlight-battery`
  - [ ] Gate completion on correct triage order and safety constraints.
  - [ ] Add escalation branch for red-flag symptoms requiring professional care.
  - [ ] Require evidence-backed kit/process selection before completion.

- `firstaid/learn-cpr`
  - [ ] Gate completion on correct triage order and safety constraints.
  - [ ] Add escalation branch for red-flag symptoms requiring professional care.
  - [ ] Require evidence-backed kit/process selection before completion.
  - [ ] Ensure medically safe sequencing and explicit escalation criteria.

- `firstaid/remove-splinter`
  - [ ] Gate completion on correct triage order and safety constraints.
  - [ ] Add escalation branch for red-flag symptoms requiring professional care.
  - [ ] Require evidence-backed kit/process selection before completion.

- `firstaid/restock-kit`
  - [ ] Gate completion on correct triage order and safety constraints.
  - [ ] Add escalation branch for red-flag symptoms requiring professional care.
  - [ ] Require evidence-backed kit/process selection before completion.

- `firstaid/sanitize-pocket-mask`
  - [ ] Gate completion on correct triage order and safety constraints.
  - [ ] Add escalation branch for red-flag symptoms requiring professional care.
  - [ ] Require evidence-backed kit/process selection before completion.

- `firstaid/splint-limb`
  - [ ] Gate completion on correct triage order and safety constraints.
  - [ ] Add escalation branch for red-flag symptoms requiring professional care.
  - [ ] Require evidence-backed kit/process selection before completion.
  - [ ] Ensure medically safe sequencing and explicit escalation criteria.

- `firstaid/stop-nosebleed`
  - [ ] Gate completion on correct triage order and safety constraints.
  - [ ] Add escalation branch for red-flag symptoms requiring professional care.
  - [ ] Require evidence-backed kit/process selection before completion.
  - [ ] Ensure medically safe sequencing and explicit escalation criteria.

- `firstaid/treat-burn`
  - [ ] Gate completion on correct triage order and safety constraints.
  - [ ] Add escalation branch for red-flag symptoms requiring professional care.
  - [ ] Require evidence-backed kit/process selection before completion.
  - [ ] Ensure medically safe sequencing and explicit escalation criteria.

- `firstaid/wound-care`
  - [ ] Gate completion on correct triage order and safety constraints.
  - [ ] Add escalation branch for red-flag symptoms requiring professional care.
  - [ ] Require evidence-backed kit/process selection before completion.
  - [ ] Ensure medically safe sequencing and explicit escalation criteria.

### geothermal (15 quests)

- `geothermal/backflush-loop-filter`
  - [ ] Expand to baseline, intervention, and post-change verification phases.
  - [ ] Require before/after readings and acceptable tolerance checks.
  - [ ] Add branch for sensor or loop faults with escalation steps.

- `geothermal/calibrate-ground-sensor`
  - [ ] Expand to baseline, intervention, and post-change verification phases.
  - [ ] Require before/after readings and acceptable tolerance checks.
  - [ ] Add branch for sensor or loop faults with escalation steps.
  - [ ] Add explicit before/after calibration readings and acceptable error bounds.

- `geothermal/check-loop-inlet-temp`
  - [ ] Expand to baseline, intervention, and post-change verification phases.
  - [ ] Require before/after readings and acceptable tolerance checks.
  - [ ] Add branch for sensor or loop faults with escalation steps.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `geothermal/check-loop-outlet-temp`
  - [ ] Expand to baseline, intervention, and post-change verification phases.
  - [ ] Require before/after readings and acceptable tolerance checks.
  - [ ] Add branch for sensor or loop faults with escalation steps.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `geothermal/check-loop-pressure`
  - [ ] Expand to baseline, intervention, and post-change verification phases.
  - [ ] Require before/after readings and acceptable tolerance checks.
  - [ ] Add branch for sensor or loop faults with escalation steps.

- `geothermal/check-loop-temp-delta`
  - [ ] Expand to baseline, intervention, and post-change verification phases.
  - [ ] Require before/after readings and acceptable tolerance checks.
  - [ ] Add branch for sensor or loop faults with escalation steps.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `geothermal/compare-depth-ground-temps`
  - [ ] Expand to baseline, intervention, and post-change verification phases.
  - [ ] Require before/after readings and acceptable tolerance checks.
  - [ ] Add branch for sensor or loop faults with escalation steps.

- `geothermal/compare-seasonal-ground-temps`
  - [ ] Expand to baseline, intervention, and post-change verification phases.
  - [ ] Require before/after readings and acceptable tolerance checks.
  - [ ] Add branch for sensor or loop faults with escalation steps.

- `geothermal/install-backup-thermistor`
  - [ ] Expand to baseline, intervention, and post-change verification phases.
  - [ ] Require before/after readings and acceptable tolerance checks.
  - [ ] Add branch for sensor or loop faults with escalation steps.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `geothermal/log-ground-temperature`
  - [ ] Expand to baseline, intervention, and post-change verification phases.
  - [ ] Require before/after readings and acceptable tolerance checks.
  - [ ] Add branch for sensor or loop faults with escalation steps.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `geothermal/log-heat-pump-warmup`
  - [ ] Expand to baseline, intervention, and post-change verification phases.
  - [ ] Require before/after readings and acceptable tolerance checks.
  - [ ] Add branch for sensor or loop faults with escalation steps.

- `geothermal/monitor-heat-pump-energy`
  - [ ] Expand to baseline, intervention, and post-change verification phases.
  - [ ] Require before/after readings and acceptable tolerance checks.
  - [ ] Add branch for sensor or loop faults with escalation steps.

- `geothermal/purge-loop-air`
  - [ ] Expand to baseline, intervention, and post-change verification phases.
  - [ ] Require before/after readings and acceptable tolerance checks.
  - [ ] Add branch for sensor or loop faults with escalation steps.

- `geothermal/replace-faulty-thermistor`
  - [ ] Expand to baseline, intervention, and post-change verification phases.
  - [ ] Require before/after readings and acceptable tolerance checks.
  - [ ] Add branch for sensor or loop faults with escalation steps.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `geothermal/survey-ground-temperature`
  - [ ] Expand to baseline, intervention, and post-change verification phases.
  - [ ] Require before/after readings and acceptable tolerance checks.
  - [ ] Add branch for sensor or loop faults with escalation steps.
  - [ ] Require logged measurements with target ranges and corrective loops.

### hydroponics (20 quests)

- `hydroponics/air-stone-soak`
  - [ ] Add staged checks for chemistry, hardware, and plant-response outcomes.
  - [ ] Require logged readings/artifacts before progression.
  - [ ] Add troubleshooting branch for root, pump, or nutrient failure modes.

- `hydroponics/ec-calibrate`
  - [ ] Add staged checks for chemistry, hardware, and plant-response outcomes.
  - [ ] Require logged readings/artifacts before progression.
  - [ ] Add troubleshooting branch for root, pump, or nutrient failure modes.
  - [ ] Add explicit before/after calibration readings and acceptable error bounds.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `hydroponics/ec-check`
  - [ ] Add staged checks for chemistry, hardware, and plant-response outcomes.
  - [ ] Require logged readings/artifacts before progression.
  - [ ] Add troubleshooting branch for root, pump, or nutrient failure modes.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `hydroponics/filter-clean`
  - [ ] Add staged checks for chemistry, hardware, and plant-response outcomes.
  - [ ] Require logged readings/artifacts before progression.
  - [ ] Add troubleshooting branch for root, pump, or nutrient failure modes.

- `hydroponics/grow-light`
  - [ ] Add staged checks for chemistry, hardware, and plant-response outcomes.
  - [ ] Require logged readings/artifacts before progression.
  - [ ] Add troubleshooting branch for root, pump, or nutrient failure modes.

- `hydroponics/lettuce`
  - [ ] Add staged checks for chemistry, hardware, and plant-response outcomes.
  - [ ] Require logged readings/artifacts before progression.
  - [ ] Add troubleshooting branch for root, pump, or nutrient failure modes.

- `hydroponics/mint-cutting`
  - [ ] Add staged checks for chemistry, hardware, and plant-response outcomes.
  - [ ] Require logged readings/artifacts before progression.
  - [ ] Add troubleshooting branch for root, pump, or nutrient failure modes.

- `hydroponics/netcup-clean`
  - [ ] Add staged checks for chemistry, hardware, and plant-response outcomes.
  - [ ] Require logged readings/artifacts before progression.
  - [ ] Add troubleshooting branch for root, pump, or nutrient failure modes.

- `hydroponics/ph-check`
  - [ ] Add staged checks for chemistry, hardware, and plant-response outcomes.
  - [ ] Require logged readings/artifacts before progression.
  - [ ] Add troubleshooting branch for root, pump, or nutrient failure modes.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `hydroponics/ph-test`
  - [ ] Add staged checks for chemistry, hardware, and plant-response outcomes.
  - [ ] Require logged readings/artifacts before progression.
  - [ ] Add troubleshooting branch for root, pump, or nutrient failure modes.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `hydroponics/plug-soak`
  - [ ] Add staged checks for chemistry, hardware, and plant-response outcomes.
  - [ ] Require logged readings/artifacts before progression.
  - [ ] Add troubleshooting branch for root, pump, or nutrient failure modes.

- `hydroponics/pump-install`
  - [ ] Add staged checks for chemistry, hardware, and plant-response outcomes.
  - [ ] Require logged readings/artifacts before progression.
  - [ ] Add troubleshooting branch for root, pump, or nutrient failure modes.

- `hydroponics/pump-prime`
  - [ ] Add staged checks for chemistry, hardware, and plant-response outcomes.
  - [ ] Require logged readings/artifacts before progression.
  - [ ] Add troubleshooting branch for root, pump, or nutrient failure modes.

- `hydroponics/regrow-stevia`
  - [ ] Add staged checks for chemistry, hardware, and plant-response outcomes.
  - [ ] Require logged readings/artifacts before progression.
  - [ ] Add troubleshooting branch for root, pump, or nutrient failure modes.

- `hydroponics/reservoir-refresh`
  - [ ] Add staged checks for chemistry, hardware, and plant-response outcomes.
  - [ ] Require logged readings/artifacts before progression.
  - [ ] Add troubleshooting branch for root, pump, or nutrient failure modes.

- `hydroponics/root-rinse`
  - [ ] Add staged checks for chemistry, hardware, and plant-response outcomes.
  - [ ] Require logged readings/artifacts before progression.
  - [ ] Add troubleshooting branch for root, pump, or nutrient failure modes.

- `hydroponics/stevia`
  - [ ] Add staged checks for chemistry, hardware, and plant-response outcomes.
  - [ ] Require logged readings/artifacts before progression.
  - [ ] Add troubleshooting branch for root, pump, or nutrient failure modes.

- `hydroponics/temp-check`
  - [ ] Add staged checks for chemistry, hardware, and plant-response outcomes.
  - [ ] Require logged readings/artifacts before progression.
  - [ ] Add troubleshooting branch for root, pump, or nutrient failure modes.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `hydroponics/top-off`
  - [ ] Add staged checks for chemistry, hardware, and plant-response outcomes.
  - [ ] Require logged readings/artifacts before progression.
  - [ ] Add troubleshooting branch for root, pump, or nutrient failure modes.

- `hydroponics/tub-scrub`
  - [ ] Add staged checks for chemistry, hardware, and plant-response outcomes.
  - [ ] Require logged readings/artifacts before progression.
  - [ ] Add troubleshooting branch for root, pump, or nutrient failure modes.

### programming (18 quests)

- `programming/avg-temp`
  - [ ] Require runnable output validation (tests, endpoint output, or parsed logs).
  - [ ] Add branch for common runtime/data errors with debugging steps.
  - [ ] Link reward to a concrete downstream capability unlock.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `programming/graph-temp`
  - [ ] Require runnable output validation (tests, endpoint output, or parsed logs).
  - [ ] Add branch for common runtime/data errors with debugging steps.
  - [ ] Link reward to a concrete downstream capability unlock.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `programming/graph-temp-data`
  - [ ] Require runnable output validation (tests, endpoint output, or parsed logs).
  - [ ] Add branch for common runtime/data errors with debugging steps.
  - [ ] Link reward to a concrete downstream capability unlock.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `programming/hello-sensor`
  - [ ] Require runnable output validation (tests, endpoint output, or parsed logs).
  - [ ] Add branch for common runtime/data errors with debugging steps.
  - [ ] Link reward to a concrete downstream capability unlock.

- `programming/http-post`
  - [ ] Require runnable output validation (tests, endpoint output, or parsed logs).
  - [ ] Add branch for common runtime/data errors with debugging steps.
  - [ ] Link reward to a concrete downstream capability unlock.
  - [ ] Add request/response failure-path handling and artifact capture.

- `programming/json-api`
  - [ ] Require runnable output validation (tests, endpoint output, or parsed logs).
  - [ ] Add branch for common runtime/data errors with debugging steps.
  - [ ] Link reward to a concrete downstream capability unlock.
  - [ ] Add request/response failure-path handling and artifact capture.

- `programming/json-endpoint`
  - [ ] Require runnable output validation (tests, endpoint output, or parsed logs).
  - [ ] Add branch for common runtime/data errors with debugging steps.
  - [ ] Link reward to a concrete downstream capability unlock.
  - [ ] Add request/response failure-path handling and artifact capture.

- `programming/median-temp`
  - [ ] Require runnable output validation (tests, endpoint output, or parsed logs).
  - [ ] Add branch for common runtime/data errors with debugging steps.
  - [ ] Link reward to a concrete downstream capability unlock.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `programming/moving-avg-temp`
  - [ ] Require runnable output validation (tests, endpoint output, or parsed logs).
  - [ ] Add branch for common runtime/data errors with debugging steps.
  - [ ] Link reward to a concrete downstream capability unlock.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `programming/plot-temp-cli`
  - [ ] Require runnable output validation (tests, endpoint output, or parsed logs).
  - [ ] Add branch for common runtime/data errors with debugging steps.
  - [ ] Link reward to a concrete downstream capability unlock.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `programming/stddev-temp`
  - [ ] Require runnable output validation (tests, endpoint output, or parsed logs).
  - [ ] Add branch for common runtime/data errors with debugging steps.
  - [ ] Link reward to a concrete downstream capability unlock.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `programming/temp-alert`
  - [ ] Require runnable output validation (tests, endpoint output, or parsed logs).
  - [ ] Add branch for common runtime/data errors with debugging steps.
  - [ ] Link reward to a concrete downstream capability unlock.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `programming/temp-email`
  - [ ] Require runnable output validation (tests, endpoint output, or parsed logs).
  - [ ] Add branch for common runtime/data errors with debugging steps.
  - [ ] Link reward to a concrete downstream capability unlock.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `programming/temp-graph`
  - [ ] Require runnable output validation (tests, endpoint output, or parsed logs).
  - [ ] Add branch for common runtime/data errors with debugging steps.
  - [ ] Link reward to a concrete downstream capability unlock.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `programming/temp-json-api`
  - [ ] Require runnable output validation (tests, endpoint output, or parsed logs).
  - [ ] Add branch for common runtime/data errors with debugging steps.
  - [ ] Link reward to a concrete downstream capability unlock.
  - [ ] Add request/response failure-path handling and artifact capture.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `programming/temp-logger`
  - [ ] Require runnable output validation (tests, endpoint output, or parsed logs).
  - [ ] Add branch for common runtime/data errors with debugging steps.
  - [ ] Link reward to a concrete downstream capability unlock.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `programming/thermistor-calibration`
  - [ ] Require runnable output validation (tests, endpoint output, or parsed logs).
  - [ ] Add branch for common runtime/data errors with debugging steps.
  - [ ] Link reward to a concrete downstream capability unlock.
  - [ ] Add explicit before/after calibration readings and acceptable error bounds.
  - [ ] Require logged measurements with target ranges and corrective loops.

- `programming/web-server`
  - [ ] Require runnable output validation (tests, endpoint output, or parsed logs).
  - [ ] Add branch for common runtime/data errors with debugging steps.
  - [ ] Link reward to a concrete downstream capability unlock.
  - [ ] Add request/response failure-path handling and artifact capture.

### robotics (13 quests)

- `robotics/gyro-balance`
  - [ ] Gate completion on measurable behavior (accuracy, repeatability, or latency).
  - [ ] Add branch for calibration drift or sensor-actuator mismatch.
  - [ ] Require a test-run artifact or telemetry proof before finish.

- `robotics/line-follower`
  - [ ] Gate completion on measurable behavior (accuracy, repeatability, or latency).
  - [ ] Add branch for calibration drift or sensor-actuator mismatch.
  - [ ] Require a test-run artifact or telemetry proof before finish.

- `robotics/maze-navigation`
  - [ ] Gate completion on measurable behavior (accuracy, repeatability, or latency).
  - [ ] Add branch for calibration drift or sensor-actuator mismatch.
  - [ ] Require a test-run artifact or telemetry proof before finish.

- `robotics/obstacle-avoidance`
  - [ ] Gate completion on measurable behavior (accuracy, repeatability, or latency).
  - [ ] Add branch for calibration drift or sensor-actuator mismatch.
  - [ ] Require a test-run artifact or telemetry proof before finish.

- `robotics/odometry-basics`
  - [ ] Gate completion on measurable behavior (accuracy, repeatability, or latency).
  - [ ] Add branch for calibration drift or sensor-actuator mismatch.
  - [ ] Require a test-run artifact or telemetry proof before finish.

- `robotics/pan-tilt`
  - [ ] Gate completion on measurable behavior (accuracy, repeatability, or latency).
  - [ ] Add branch for calibration drift or sensor-actuator mismatch.
  - [ ] Require a test-run artifact or telemetry proof before finish.

- `robotics/reflectance-sensors`
  - [ ] Gate completion on measurable behavior (accuracy, repeatability, or latency).
  - [ ] Add branch for calibration drift or sensor-actuator mismatch.
  - [ ] Require a test-run artifact or telemetry proof before finish.

- `robotics/servo-arm`
  - [ ] Gate completion on measurable behavior (accuracy, repeatability, or latency).
  - [ ] Add branch for calibration drift or sensor-actuator mismatch.
  - [ ] Require a test-run artifact or telemetry proof before finish.

- `robotics/servo-control`
  - [ ] Gate completion on measurable behavior (accuracy, repeatability, or latency).
  - [ ] Add branch for calibration drift or sensor-actuator mismatch.
  - [ ] Require a test-run artifact or telemetry proof before finish.

- `robotics/servo-gripper`
  - [ ] Gate completion on measurable behavior (accuracy, repeatability, or latency).
  - [ ] Add branch for calibration drift or sensor-actuator mismatch.
  - [ ] Require a test-run artifact or telemetry proof before finish.

- `robotics/servo-radar`
  - [ ] Gate completion on measurable behavior (accuracy, repeatability, or latency).
  - [ ] Add branch for calibration drift or sensor-actuator mismatch.
  - [ ] Require a test-run artifact or telemetry proof before finish.

- `robotics/ultrasonic-rangefinder`
  - [ ] Gate completion on measurable behavior (accuracy, repeatability, or latency).
  - [ ] Add branch for calibration drift or sensor-actuator mismatch.
  - [ ] Require a test-run artifact or telemetry proof before finish.

- `robotics/wheel-encoders`
  - [ ] Gate completion on measurable behavior (accuracy, repeatability, or latency).
  - [ ] Add branch for calibration drift or sensor-actuator mismatch.
  - [ ] Require a test-run artifact or telemetry proof before finish.

### rocketry (8 quests)

- `rocketry/fuel-mixture`
  - [ ] Separate prep, safety, launch/stand test, and post-run review checkpoints.
  - [ ] Require objective telemetry or checklist evidence before completion.
  - [ ] Add weather/safety abort branch with recovery plan.
  - [ ] Add safety go/no-go checklist and abort-path verification.

- `rocketry/guided-rocket-build`
  - [ ] Separate prep, safety, launch/stand test, and post-run review checkpoints.
  - [ ] Require objective telemetry or checklist evidence before completion.
  - [ ] Add weather/safety abort branch with recovery plan.

- `rocketry/night-launch`
  - [ ] Separate prep, safety, launch/stand test, and post-run review checkpoints.
  - [ ] Require objective telemetry or checklist evidence before completion.
  - [ ] Add weather/safety abort branch with recovery plan.
  - [ ] Add safety go/no-go checklist and abort-path verification.

- `rocketry/preflight-check`
  - [ ] Separate prep, safety, launch/stand test, and post-run review checkpoints.
  - [ ] Require objective telemetry or checklist evidence before completion.
  - [ ] Add weather/safety abort branch with recovery plan.
  - [ ] Add safety go/no-go checklist and abort-path verification.

- `rocketry/recovery-run`
  - [ ] Separate prep, safety, launch/stand test, and post-run review checkpoints.
  - [ ] Require objective telemetry or checklist evidence before completion.
  - [ ] Add weather/safety abort branch with recovery plan.

- `rocketry/static-test`
  - [ ] Separate prep, safety, launch/stand test, and post-run review checkpoints.
  - [ ] Require objective telemetry or checklist evidence before completion.
  - [ ] Add weather/safety abort branch with recovery plan.
  - [ ] Add safety go/no-go checklist and abort-path verification.

- `rocketry/suborbital-hop`
  - [ ] Separate prep, safety, launch/stand test, and post-run review checkpoints.
  - [ ] Require objective telemetry or checklist evidence before completion.
  - [ ] Add weather/safety abort branch with recovery plan.

- `rocketry/wind-check`
  - [ ] Separate prep, safety, launch/stand test, and post-run review checkpoints.
  - [ ] Require objective telemetry or checklist evidence before completion.
  - [ ] Add weather/safety abort branch with recovery plan.

### ubi (3 quests)

- `ubi/first-payment`
  - [ ] Add decision branch showing tradeoffs (save, spend, invest, or share).
  - [ ] Require evidence of budget outcome rather than single-click completion.
  - [ ] Differentiate rewards so progression feels meaningful, not cosmetic only.

- `ubi/reminder`
  - [ ] Add decision branch showing tradeoffs (save, spend, invest, or share).
  - [ ] Require evidence of budget outcome rather than single-click completion.
  - [ ] Differentiate rewards so progression feels meaningful, not cosmetic only.

- `ubi/savings-goal`
  - [ ] Add decision branch showing tradeoffs (save, spend, invest, or share).
  - [ ] Require evidence of budget outcome rather than single-click completion.
  - [ ] Differentiate rewards so progression feels meaningful, not cosmetic only.

### woodworking (10 quests)

- `woodworking/apply-finish`
  - [ ] Require measurement/tolerance checks before completion.
  - [ ] Add branch for common fabrication defects and correction steps.
  - [ ] Require process- or tool-backed proof of fit/finish quality.

- `woodworking/birdhouse`
  - [ ] Require measurement/tolerance checks before completion.
  - [ ] Add branch for common fabrication defects and correction steps.
  - [ ] Require process- or tool-backed proof of fit/finish quality.

- `woodworking/bookshelf`
  - [ ] Require measurement/tolerance checks before completion.
  - [ ] Add branch for common fabrication defects and correction steps.
  - [ ] Require process- or tool-backed proof of fit/finish quality.

- `woodworking/coffee-table`
  - [ ] Require measurement/tolerance checks before completion.
  - [ ] Add branch for common fabrication defects and correction steps.
  - [ ] Require process- or tool-backed proof of fit/finish quality.

- `woodworking/finish-sanding`
  - [ ] Require measurement/tolerance checks before completion.
  - [ ] Add branch for common fabrication defects and correction steps.
  - [ ] Require process- or tool-backed proof of fit/finish quality.

- `woodworking/picture-frame`
  - [ ] Require measurement/tolerance checks before completion.
  - [ ] Add branch for common fabrication defects and correction steps.
  - [ ] Require process- or tool-backed proof of fit/finish quality.

- `woodworking/planter-box`
  - [ ] Require measurement/tolerance checks before completion.
  - [ ] Add branch for common fabrication defects and correction steps.
  - [ ] Require process- or tool-backed proof of fit/finish quality.

- `woodworking/step-stool`
  - [ ] Require measurement/tolerance checks before completion.
  - [ ] Add branch for common fabrication defects and correction steps.
  - [ ] Require process- or tool-backed proof of fit/finish quality.

- `woodworking/tool-rack`
  - [ ] Require measurement/tolerance checks before completion.
  - [ ] Add branch for common fabrication defects and correction steps.
  - [ ] Require process- or tool-backed proof of fit/finish quality.

- `woodworking/workbench`
  - [ ] Require measurement/tolerance checks before completion.
  - [ ] Add branch for common fabrication defects and correction steps.
  - [ ] Require process- or tool-backed proof of fit/finish quality.

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
