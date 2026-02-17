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

Use this as an actionable backlog for quest polishing passes. Every unchecked “new in v3” quest is listed below with a shared issue profile and parity suggestions.

Current coverage snapshot (from `docs/new-quests.md` + `docs/qa/v3.md` §4.5):
- New-in-v3 quests: **225**
- New-in-v3 quests already manually checked: **12**
- New-in-v3 quests still unchecked/problematic: **213**

Shared issue profile used for triage tags: **thin-flow**, **no-branch**, **no-process-evidence**, **weak-gating**, **low-interaction**.

### 3dprinting (12 quests)
Parity focus: Add calibration diagnostics, explicit reprint loop, and process-backed output proof before `finish`.

- [ ] `3dprinting/bed-leveling` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add calibration diagnostics, explicit reprint loop, and process-backed output proof before `finish`.
- [ ] `3dprinting/blob-of-death` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add calibration diagnostics, explicit reprint loop, and process-backed output proof before `finish`.
- [ ] `3dprinting/cable-clip` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add calibration diagnostics, explicit reprint loop, and process-backed output proof before `finish`.
- [ ] `3dprinting/calibration-cube` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add calibration diagnostics, explicit reprint loop, and process-backed output proof before `finish`.
- [ ] `3dprinting/filament-change` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add calibration diagnostics, explicit reprint loop, and process-backed output proof before `finish`.
- [ ] `3dprinting/nozzle-cleaning` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add calibration diagnostics, explicit reprint loop, and process-backed output proof before `finish`.
- [ ] `3dprinting/nozzle-clog` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add calibration diagnostics, explicit reprint loop, and process-backed output proof before `finish`.
- [ ] `3dprinting/phone-stand` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add calibration diagnostics, explicit reprint loop, and process-backed output proof before `finish`.
- [ ] `3dprinting/retraction-test` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add calibration diagnostics, explicit reprint loop, and process-backed output proof before `finish`.
- [ ] `3dprinting/spool-holder` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add calibration diagnostics, explicit reprint loop, and process-backed output proof before `finish`.
- [ ] `3dprinting/temperature-tower` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add calibration diagnostics, explicit reprint loop, and process-backed output proof before `finish`.
- [ ] `3dprinting/x-belt-tension` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add calibration diagnostics, explicit reprint loop, and process-backed output proof before `finish`.

### aquaria (18 quests)
Parity focus: Add parameter logging checkpoints, fish/stress safety branch, and maintenance evidence artifacts.

- [ ] `aquaria/aquarium-light` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter logging checkpoints, fish/stress safety branch, and maintenance evidence artifacts.
- [ ] `aquaria/balance-ph` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter logging checkpoints, fish/stress safety branch, and maintenance evidence artifacts.
- [ ] `aquaria/breeding` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter logging checkpoints, fish/stress safety branch, and maintenance evidence artifacts.
- [ ] `aquaria/filter-rinse` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter logging checkpoints, fish/stress safety branch, and maintenance evidence artifacts.
- [ ] `aquaria/floating-plants` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter logging checkpoints, fish/stress safety branch, and maintenance evidence artifacts.
- [ ] `aquaria/guppy` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter logging checkpoints, fish/stress safety branch, and maintenance evidence artifacts.
- [ ] `aquaria/heater-install` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter logging checkpoints, fish/stress safety branch, and maintenance evidence artifacts.
- [ ] `aquaria/log-water-parameters` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter logging checkpoints, fish/stress safety branch, and maintenance evidence artifacts.
- [ ] `aquaria/net-fish` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter logging checkpoints, fish/stress safety branch, and maintenance evidence artifacts.
- [ ] `aquaria/ph-strip-test` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter logging checkpoints, fish/stress safety branch, and maintenance evidence artifacts.
- [ ] `aquaria/position-tank` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter logging checkpoints, fish/stress safety branch, and maintenance evidence artifacts.
- [ ] `aquaria/shrimp` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter logging checkpoints, fish/stress safety branch, and maintenance evidence artifacts.
- [ ] `aquaria/sponge-filter` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter logging checkpoints, fish/stress safety branch, and maintenance evidence artifacts.
- [ ] `aquaria/thermometer` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter logging checkpoints, fish/stress safety branch, and maintenance evidence artifacts.
- [ ] `aquaria/top-off` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter logging checkpoints, fish/stress safety branch, and maintenance evidence artifacts.
- [ ] `aquaria/walstad` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter logging checkpoints, fish/stress safety branch, and maintenance evidence artifacts.
- [ ] `aquaria/water-change` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter logging checkpoints, fish/stress safety branch, and maintenance evidence artifacts.
- [ ] `aquaria/water-testing` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter logging checkpoints, fish/stress safety branch, and maintenance evidence artifacts.

### astronomy (21 quests)
Parity focus: Add seeing-condition fallback branches, observation evidence, and troubleshooting for weather/light pollution.

- [ ] `astronomy/andromeda` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add seeing-condition fallback branches, observation evidence, and troubleshooting for weather/light pollution.
- [ ] `astronomy/aurora-watch` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add seeing-condition fallback branches, observation evidence, and troubleshooting for weather/light pollution.
- [ ] `astronomy/basic-telescope` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add seeing-condition fallback branches, observation evidence, and troubleshooting for weather/light pollution.
- [ ] `astronomy/binary-star` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add seeing-condition fallback branches, observation evidence, and troubleshooting for weather/light pollution.
- [ ] `astronomy/comet-tracking` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add seeing-condition fallback branches, observation evidence, and troubleshooting for weather/light pollution.
- [ ] `astronomy/constellations` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add seeing-condition fallback branches, observation evidence, and troubleshooting for weather/light pollution.
- [ ] `astronomy/iss-flyover` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add seeing-condition fallback branches, observation evidence, and troubleshooting for weather/light pollution.
- [ ] `astronomy/iss-photo` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add seeing-condition fallback branches, observation evidence, and troubleshooting for weather/light pollution.
- [ ] `astronomy/jupiter-moons` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add seeing-condition fallback branches, observation evidence, and troubleshooting for weather/light pollution.
- [ ] `astronomy/light-pollution` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add seeing-condition fallback branches, observation evidence, and troubleshooting for weather/light pollution.
- [ ] `astronomy/lunar-eclipse` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add seeing-condition fallback branches, observation evidence, and troubleshooting for weather/light pollution.
- [ ] `astronomy/meteor-shower` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add seeing-condition fallback branches, observation evidence, and troubleshooting for weather/light pollution.
- [ ] `astronomy/north-star` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add seeing-condition fallback branches, observation evidence, and troubleshooting for weather/light pollution.
- [ ] `astronomy/observe-moon` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add seeing-condition fallback branches, observation evidence, and troubleshooting for weather/light pollution.
- [ ] `astronomy/orion-nebula` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add seeing-condition fallback branches, observation evidence, and troubleshooting for weather/light pollution.
- [ ] `astronomy/planetary-alignment` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add seeing-condition fallback branches, observation evidence, and troubleshooting for weather/light pollution.
- [ ] `astronomy/satellite-pass` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add seeing-condition fallback branches, observation evidence, and troubleshooting for weather/light pollution.
- [ ] `astronomy/saturn-rings` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add seeing-condition fallback branches, observation evidence, and troubleshooting for weather/light pollution.
- [ ] `astronomy/star-trails` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add seeing-condition fallback branches, observation evidence, and troubleshooting for weather/light pollution.
- [ ] `astronomy/sunspot-sketch` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add seeing-condition fallback branches, observation evidence, and troubleshooting for weather/light pollution.
- [ ] `astronomy/venus-phases` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add seeing-condition fallback branches, observation evidence, and troubleshooting for weather/light pollution.

### chemistry (10 quests)
Parity focus: Add PPE + hazard verification gates, measurement evidence, and corrective branch for off-target readings.

- [ ] `chemistry/acid-dilution` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add PPE + hazard verification gates, measurement evidence, and corrective branch for off-target readings.
- [ ] `chemistry/acid-neutralization` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add PPE + hazard verification gates, measurement evidence, and corrective branch for off-target readings.
- [ ] `chemistry/buffer-solution` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add PPE + hazard verification gates, measurement evidence, and corrective branch for off-target readings.
- [ ] `chemistry/ph-adjustment` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add PPE + hazard verification gates, measurement evidence, and corrective branch for off-target readings.
- [ ] `chemistry/ph-test` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add PPE + hazard verification gates, measurement evidence, and corrective branch for off-target readings.
- [ ] `chemistry/precipitation-reaction` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add PPE + hazard verification gates, measurement evidence, and corrective branch for off-target readings.
- [ ] `chemistry/safe-reaction` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add PPE + hazard verification gates, measurement evidence, and corrective branch for off-target readings.
- [ ] `chemistry/stevia-crystals` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add PPE + hazard verification gates, measurement evidence, and corrective branch for off-target readings.
- [ ] `chemistry/stevia-extraction` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add PPE + hazard verification gates, measurement evidence, and corrective branch for off-target readings.
- [ ] `chemistry/stevia-tasting` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add PPE + hazard verification gates, measurement evidence, and corrective branch for off-target readings.

### completionist (4 quests)
Parity focus: Add multi-step curation criteria, inventory proof checkpoints, and anti-grind branching goals.

- [ ] `completionist/catalog` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add multi-step curation criteria, inventory proof checkpoints, and anti-grind branching goals.
- [ ] `completionist/display` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add multi-step curation criteria, inventory proof checkpoints, and anti-grind branching goals.
- [ ] `completionist/polish` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add multi-step curation criteria, inventory proof checkpoints, and anti-grind branching goals.
- [ ] `completionist/reminder` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add multi-step curation criteria, inventory proof checkpoints, and anti-grind branching goals.

### devops (15 quests)
Parity focus: Split setup/config/verify gates, capture command/log artifacts, and add rollback/lockout recovery branches.

- [ ] `devops/auto-updates` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Split setup/config/verify gates, capture command/log artifacts, and add rollback/lockout recovery branches.
- [ ] `devops/ci-pipeline` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Split setup/config/verify gates, capture command/log artifacts, and add rollback/lockout recovery branches.
- [ ] `devops/daily-backups` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Split setup/config/verify gates, capture command/log artifacts, and add rollback/lockout recovery branches.
- [ ] `devops/docker-compose` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Split setup/config/verify gates, capture command/log artifacts, and add rollback/lockout recovery branches.
- [ ] `devops/enable-https` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Split setup/config/verify gates, capture command/log artifacts, and add rollback/lockout recovery branches.
- [ ] `devops/fail2ban` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Split setup/config/verify gates, capture command/log artifacts, and add rollback/lockout recovery branches.
- [ ] `devops/firewall-rules` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Split setup/config/verify gates, capture command/log artifacts, and add rollback/lockout recovery branches.
- [ ] `devops/k3s-deploy` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Split setup/config/verify gates, capture command/log artifacts, and add rollback/lockout recovery branches.
- [ ] `devops/log-maintenance` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Split setup/config/verify gates, capture command/log artifacts, and add rollback/lockout recovery branches.
- [ ] `devops/monitoring` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Split setup/config/verify gates, capture command/log artifacts, and add rollback/lockout recovery branches.
- [ ] `devops/pi-cluster-hardware` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Split setup/config/verify gates, capture command/log artifacts, and add rollback/lockout recovery branches.
- [ ] `devops/prepare-first-node` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Split setup/config/verify gates, capture command/log artifacts, and add rollback/lockout recovery branches.
- [ ] `devops/private-registry` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Split setup/config/verify gates, capture command/log artifacts, and add rollback/lockout recovery branches.
- [ ] `devops/ssd-boot` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Split setup/config/verify gates, capture command/log artifacts, and add rollback/lockout recovery branches.
- [ ] `devops/ssh-hardening` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Split setup/config/verify gates, capture command/log artifacts, and add rollback/lockout recovery branches.

### electronics (22 quests)
Parity focus: Add measurement validation branches, fault isolation loops, and process/item evidence before completion.

- [ ] `electronics/arduino-blink` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add measurement validation branches, fault isolation loops, and process/item evidence before completion.
- [ ] `electronics/basic-circuit` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add measurement validation branches, fault isolation loops, and process/item evidence before completion.
- [ ] `electronics/check-battery-voltage` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add measurement validation branches, fault isolation loops, and process/item evidence before completion.
- [ ] `electronics/continuity-test` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add measurement validation branches, fault isolation loops, and process/item evidence before completion.
- [ ] `electronics/data-logger` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add measurement validation branches, fault isolation loops, and process/item evidence before completion.
- [ ] `electronics/desolder-component` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add measurement validation branches, fault isolation loops, and process/item evidence before completion.
- [ ] `electronics/led-polarity` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add measurement validation branches, fault isolation loops, and process/item evidence before completion.
- [ ] `electronics/light-sensor` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add measurement validation branches, fault isolation loops, and process/item evidence before completion.
- [ ] `electronics/measure-arduino-5v` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add measurement validation branches, fault isolation loops, and process/item evidence before completion.
- [ ] `electronics/measure-led-current` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add measurement validation branches, fault isolation loops, and process/item evidence before completion.
- [ ] `electronics/measure-resistance` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add measurement validation branches, fault isolation loops, and process/item evidence before completion.
- [ ] `electronics/potentiometer-dimmer` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add measurement validation branches, fault isolation loops, and process/item evidence before completion.
- [ ] `electronics/resistor-color-check` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add measurement validation branches, fault isolation loops, and process/item evidence before completion.
- [ ] `electronics/servo-sweep` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add measurement validation branches, fault isolation loops, and process/item evidence before completion.
- [ ] `electronics/solder-led-harness` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add measurement validation branches, fault isolation loops, and process/item evidence before completion.
- [ ] `electronics/solder-wire` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add measurement validation branches, fault isolation loops, and process/item evidence before completion.
- [ ] `electronics/soldering-intro` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add measurement validation branches, fault isolation loops, and process/item evidence before completion.
- [ ] `electronics/temperature-plot` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add measurement validation branches, fault isolation loops, and process/item evidence before completion.
- [ ] `electronics/test-gfci-outlet` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add measurement validation branches, fault isolation loops, and process/item evidence before completion.
- [ ] `electronics/thermistor-reading` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add measurement validation branches, fault isolation loops, and process/item evidence before completion.
- [ ] `electronics/thermometer-calibration` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add measurement validation branches, fault isolation loops, and process/item evidence before completion.
- [ ] `electronics/voltage-divider` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add measurement validation branches, fault isolation loops, and process/item evidence before completion.

### energy (11 quests)
Parity focus: Replace pure accumulation with strategy branches (efficiency/storage/uptime), plus process-backed checkpoints.

- [ ] `energy/battery-maintenance` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Replace pure accumulation with strategy branches (efficiency/storage/uptime), plus process-backed checkpoints.
- [ ] `energy/battery-upgrade` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Replace pure accumulation with strategy branches (efficiency/storage/uptime), plus process-backed checkpoints.
- [ ] `energy/biogas-digester` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Replace pure accumulation with strategy branches (efficiency/storage/uptime), plus process-backed checkpoints.
- [ ] `energy/charge-controller-setup` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Replace pure accumulation with strategy branches (efficiency/storage/uptime), plus process-backed checkpoints.
- [ ] `energy/dWatt-1e8` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Replace pure accumulation with strategy branches (efficiency/storage/uptime), plus process-backed checkpoints.
- [ ] `energy/hand-crank-generator` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Replace pure accumulation with strategy branches (efficiency/storage/uptime), plus process-backed checkpoints.
- [ ] `energy/offgrid-charger` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Replace pure accumulation with strategy branches (efficiency/storage/uptime), plus process-backed checkpoints.
- [ ] `energy/portable-solar-panel` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Replace pure accumulation with strategy branches (efficiency/storage/uptime), plus process-backed checkpoints.
- [ ] `energy/power-inverter` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Replace pure accumulation with strategy branches (efficiency/storage/uptime), plus process-backed checkpoints.
- [ ] `energy/solar-tracker` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Replace pure accumulation with strategy branches (efficiency/storage/uptime), plus process-backed checkpoints.
- [ ] `energy/wind-turbine` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Replace pure accumulation with strategy branches (efficiency/storage/uptime), plus process-backed checkpoints.

### firstaid (13 quests)
Parity focus: Add triage severity branching, safe-sequence gates, and misuse warnings with kit-item evidence.

- [ ] `firstaid/assemble-kit` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add triage severity branching, safe-sequence gates, and misuse warnings with kit-item evidence.
- [ ] `firstaid/change-bandage` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add triage severity branching, safe-sequence gates, and misuse warnings with kit-item evidence.
- [ ] `firstaid/dispose-bandages` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add triage severity branching, safe-sequence gates, and misuse warnings with kit-item evidence.
- [ ] `firstaid/dispose-expired` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add triage severity branching, safe-sequence gates, and misuse warnings with kit-item evidence.
- [ ] `firstaid/flashlight-battery` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add triage severity branching, safe-sequence gates, and misuse warnings with kit-item evidence.
- [ ] `firstaid/learn-cpr` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add triage severity branching, safe-sequence gates, and misuse warnings with kit-item evidence.
- [ ] `firstaid/remove-splinter` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add triage severity branching, safe-sequence gates, and misuse warnings with kit-item evidence.
- [ ] `firstaid/restock-kit` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add triage severity branching, safe-sequence gates, and misuse warnings with kit-item evidence.
- [ ] `firstaid/sanitize-pocket-mask` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add triage severity branching, safe-sequence gates, and misuse warnings with kit-item evidence.
- [ ] `firstaid/splint-limb` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add triage severity branching, safe-sequence gates, and misuse warnings with kit-item evidence.
- [ ] `firstaid/stop-nosebleed` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add triage severity branching, safe-sequence gates, and misuse warnings with kit-item evidence.
- [ ] `firstaid/treat-burn` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add triage severity branching, safe-sequence gates, and misuse warnings with kit-item evidence.
- [ ] `firstaid/wound-care` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add triage severity branching, safe-sequence gates, and misuse warnings with kit-item evidence.

### geothermal (15 quests)
Parity focus: Add baseline→calibration→verification cadence, before/after readings, and fault escalation branches.

- [ ] `geothermal/backflush-loop-filter` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add baseline→calibration→verification cadence, before/after readings, and fault escalation branches.
- [ ] `geothermal/calibrate-ground-sensor` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add baseline→calibration→verification cadence, before/after readings, and fault escalation branches.
- [ ] `geothermal/check-loop-inlet-temp` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add baseline→calibration→verification cadence, before/after readings, and fault escalation branches.
- [ ] `geothermal/check-loop-outlet-temp` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add baseline→calibration→verification cadence, before/after readings, and fault escalation branches.
- [ ] `geothermal/check-loop-pressure` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add baseline→calibration→verification cadence, before/after readings, and fault escalation branches.
- [ ] `geothermal/check-loop-temp-delta` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add baseline→calibration→verification cadence, before/after readings, and fault escalation branches.
- [ ] `geothermal/compare-depth-ground-temps` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add baseline→calibration→verification cadence, before/after readings, and fault escalation branches.
- [ ] `geothermal/compare-seasonal-ground-temps` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add baseline→calibration→verification cadence, before/after readings, and fault escalation branches.
- [ ] `geothermal/install-backup-thermistor` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add baseline→calibration→verification cadence, before/after readings, and fault escalation branches.
- [ ] `geothermal/log-ground-temperature` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add baseline→calibration→verification cadence, before/after readings, and fault escalation branches.
- [ ] `geothermal/log-heat-pump-warmup` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add baseline→calibration→verification cadence, before/after readings, and fault escalation branches.
- [ ] `geothermal/monitor-heat-pump-energy` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add baseline→calibration→verification cadence, before/after readings, and fault escalation branches.
- [ ] `geothermal/purge-loop-air` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add baseline→calibration→verification cadence, before/after readings, and fault escalation branches.
- [ ] `geothermal/replace-faulty-thermistor` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add baseline→calibration→verification cadence, before/after readings, and fault escalation branches.
- [ ] `geothermal/survey-ground-temperature` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add baseline→calibration→verification cadence, before/after readings, and fault escalation branches.

### hydroponics (20 quests)
Parity focus: Add parameter drift troubleshooting, multi-checkpoint care loops, and process evidence for interventions.

- [ ] `hydroponics/air-stone-soak` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter drift troubleshooting, multi-checkpoint care loops, and process evidence for interventions.
- [ ] `hydroponics/ec-calibrate` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter drift troubleshooting, multi-checkpoint care loops, and process evidence for interventions.
- [ ] `hydroponics/ec-check` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter drift troubleshooting, multi-checkpoint care loops, and process evidence for interventions.
- [ ] `hydroponics/filter-clean` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter drift troubleshooting, multi-checkpoint care loops, and process evidence for interventions.
- [ ] `hydroponics/grow-light` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter drift troubleshooting, multi-checkpoint care loops, and process evidence for interventions.
- [ ] `hydroponics/lettuce` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter drift troubleshooting, multi-checkpoint care loops, and process evidence for interventions.
- [ ] `hydroponics/mint-cutting` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter drift troubleshooting, multi-checkpoint care loops, and process evidence for interventions.
- [ ] `hydroponics/netcup-clean` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter drift troubleshooting, multi-checkpoint care loops, and process evidence for interventions.
- [ ] `hydroponics/ph-check` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter drift troubleshooting, multi-checkpoint care loops, and process evidence for interventions.
- [ ] `hydroponics/ph-test` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter drift troubleshooting, multi-checkpoint care loops, and process evidence for interventions.
- [ ] `hydroponics/plug-soak` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter drift troubleshooting, multi-checkpoint care loops, and process evidence for interventions.
- [ ] `hydroponics/pump-install` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter drift troubleshooting, multi-checkpoint care loops, and process evidence for interventions.
- [ ] `hydroponics/pump-prime` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter drift troubleshooting, multi-checkpoint care loops, and process evidence for interventions.
- [ ] `hydroponics/regrow-stevia` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter drift troubleshooting, multi-checkpoint care loops, and process evidence for interventions.
- [ ] `hydroponics/reservoir-refresh` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter drift troubleshooting, multi-checkpoint care loops, and process evidence for interventions.
- [ ] `hydroponics/root-rinse` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter drift troubleshooting, multi-checkpoint care loops, and process evidence for interventions.
- [ ] `hydroponics/stevia` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter drift troubleshooting, multi-checkpoint care loops, and process evidence for interventions.
- [ ] `hydroponics/temp-check` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter drift troubleshooting, multi-checkpoint care loops, and process evidence for interventions.
- [ ] `hydroponics/top-off` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter drift troubleshooting, multi-checkpoint care loops, and process evidence for interventions.
- [ ] `hydroponics/tub-scrub` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add parameter drift troubleshooting, multi-checkpoint care loops, and process evidence for interventions.

### programming (18 quests)
Parity focus: Add failing-test/verify loops, observable artifacts (logs/output), and error-handling branches.

- [ ] `programming/avg-temp` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add failing-test/verify loops, observable artifacts (logs/output), and error-handling branches.
- [ ] `programming/graph-temp` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add failing-test/verify loops, observable artifacts (logs/output), and error-handling branches.
- [ ] `programming/graph-temp-data` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add failing-test/verify loops, observable artifacts (logs/output), and error-handling branches.
- [ ] `programming/hello-sensor` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add failing-test/verify loops, observable artifacts (logs/output), and error-handling branches.
- [ ] `programming/http-post` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add failing-test/verify loops, observable artifacts (logs/output), and error-handling branches.
- [ ] `programming/json-api` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add failing-test/verify loops, observable artifacts (logs/output), and error-handling branches.
- [ ] `programming/json-endpoint` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add failing-test/verify loops, observable artifacts (logs/output), and error-handling branches.
- [ ] `programming/median-temp` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add failing-test/verify loops, observable artifacts (logs/output), and error-handling branches.
- [ ] `programming/moving-avg-temp` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add failing-test/verify loops, observable artifacts (logs/output), and error-handling branches.
- [ ] `programming/plot-temp-cli` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add failing-test/verify loops, observable artifacts (logs/output), and error-handling branches.
- [ ] `programming/stddev-temp` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add failing-test/verify loops, observable artifacts (logs/output), and error-handling branches.
- [ ] `programming/temp-alert` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add failing-test/verify loops, observable artifacts (logs/output), and error-handling branches.
- [ ] `programming/temp-email` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add failing-test/verify loops, observable artifacts (logs/output), and error-handling branches.
- [ ] `programming/temp-graph` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add failing-test/verify loops, observable artifacts (logs/output), and error-handling branches.
- [ ] `programming/temp-json-api` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add failing-test/verify loops, observable artifacts (logs/output), and error-handling branches.
- [ ] `programming/temp-logger` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add failing-test/verify loops, observable artifacts (logs/output), and error-handling branches.
- [ ] `programming/thermistor-calibration` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add failing-test/verify loops, observable artifacts (logs/output), and error-handling branches.
- [ ] `programming/web-server` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add failing-test/verify loops, observable artifacts (logs/output), and error-handling branches.

### robotics (13 quests)
Parity focus: Add sensor-calibration checkpoints, recovery branches for drift/collision, and telemetry-based evidence.

- [ ] `robotics/gyro-balance` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add sensor-calibration checkpoints, recovery branches for drift/collision, and telemetry-based evidence.
- [ ] `robotics/line-follower` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add sensor-calibration checkpoints, recovery branches for drift/collision, and telemetry-based evidence.
- [ ] `robotics/maze-navigation` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add sensor-calibration checkpoints, recovery branches for drift/collision, and telemetry-based evidence.
- [ ] `robotics/obstacle-avoidance` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add sensor-calibration checkpoints, recovery branches for drift/collision, and telemetry-based evidence.
- [ ] `robotics/odometry-basics` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add sensor-calibration checkpoints, recovery branches for drift/collision, and telemetry-based evidence.
- [ ] `robotics/pan-tilt` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add sensor-calibration checkpoints, recovery branches for drift/collision, and telemetry-based evidence.
- [ ] `robotics/reflectance-sensors` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add sensor-calibration checkpoints, recovery branches for drift/collision, and telemetry-based evidence.
- [ ] `robotics/servo-arm` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add sensor-calibration checkpoints, recovery branches for drift/collision, and telemetry-based evidence.
- [ ] `robotics/servo-control` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add sensor-calibration checkpoints, recovery branches for drift/collision, and telemetry-based evidence.
- [ ] `robotics/servo-gripper` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add sensor-calibration checkpoints, recovery branches for drift/collision, and telemetry-based evidence.
- [ ] `robotics/servo-radar` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add sensor-calibration checkpoints, recovery branches for drift/collision, and telemetry-based evidence.
- [ ] `robotics/ultrasonic-rangefinder` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add sensor-calibration checkpoints, recovery branches for drift/collision, and telemetry-based evidence.
- [ ] `robotics/wheel-encoders` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add sensor-calibration checkpoints, recovery branches for drift/collision, and telemetry-based evidence.

### rocketry (8 quests)
Parity focus: Add safety hold points, preflight/postflight evidence, and contingency branches for abort/recovery.

- [ ] `rocketry/fuel-mixture` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add safety hold points, preflight/postflight evidence, and contingency branches for abort/recovery.
- [ ] `rocketry/guided-rocket-build` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add safety hold points, preflight/postflight evidence, and contingency branches for abort/recovery.
- [ ] `rocketry/night-launch` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add safety hold points, preflight/postflight evidence, and contingency branches for abort/recovery.
- [ ] `rocketry/preflight-check` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add safety hold points, preflight/postflight evidence, and contingency branches for abort/recovery.
- [ ] `rocketry/recovery-run` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add safety hold points, preflight/postflight evidence, and contingency branches for abort/recovery.
- [ ] `rocketry/static-test` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add safety hold points, preflight/postflight evidence, and contingency branches for abort/recovery.
- [ ] `rocketry/suborbital-hop` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add safety hold points, preflight/postflight evidence, and contingency branches for abort/recovery.
- [ ] `rocketry/wind-check` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add safety hold points, preflight/postflight evidence, and contingency branches for abort/recovery.

### ubi (3 quests)
Parity focus: Add decision branches with measurable budgeting outcomes and proof artifacts beyond reminder-style completion.

- [ ] `ubi/first-payment` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add decision branches with measurable budgeting outcomes and proof artifacts beyond reminder-style completion.
- [ ] `ubi/reminder` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add decision branches with measurable budgeting outcomes and proof artifacts beyond reminder-style completion.
- [ ] `ubi/savings-goal` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add decision branches with measurable budgeting outcomes and proof artifacts beyond reminder-style completion.

### woodworking (10 quests)
Parity focus: Add tolerance/measurement gates, rework branches for miscuts, and process-backed build checklists.

- [ ] `woodworking/apply-finish` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add tolerance/measurement gates, rework branches for miscuts, and process-backed build checklists.
- [ ] `woodworking/birdhouse` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add tolerance/measurement gates, rework branches for miscuts, and process-backed build checklists.
- [ ] `woodworking/bookshelf` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add tolerance/measurement gates, rework branches for miscuts, and process-backed build checklists.
- [ ] `woodworking/coffee-table` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add tolerance/measurement gates, rework branches for miscuts, and process-backed build checklists.
- [ ] `woodworking/finish-sanding` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add tolerance/measurement gates, rework branches for miscuts, and process-backed build checklists.
- [ ] `woodworking/picture-frame` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add tolerance/measurement gates, rework branches for miscuts, and process-backed build checklists.
- [ ] `woodworking/planter-box` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add tolerance/measurement gates, rework branches for miscuts, and process-backed build checklists.
- [ ] `woodworking/step-stool` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add tolerance/measurement gates, rework branches for miscuts, and process-backed build checklists.
- [ ] `woodworking/tool-rack` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add tolerance/measurement gates, rework branches for miscuts, and process-backed build checklists.
- [ ] `woodworking/workbench` — issues: `thin-flow`, `no-branch`, `no-process-evidence`, `weak-gating`, `low-interaction`; parity checklist: Add tolerance/measurement gates, rework branches for miscuts, and process-backed build checklists.


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
