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

This backlog enumerates every **unchecked quest that is newly added in v3** (231 total), using `docs/new-quests.md` intersected with unchecked entries from `docs/qa/v3.md` §4.5.

Legend: each entry lists detected quality risks + a parity checklist derived from patterns in checked quests (`composting/*`, `hydroponics/nutrient-check`, `sysadmin/*`, `welcome/*`).
### 3dprinting (15)
- `3dprinting/bed-leveling` — issues: thin dialogue graph (nodes=4, options=6, processOptions=1, gatedOptions=3).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add a quality-control checkpoint (tolerance/alignment/continuity) before finish.
- `3dprinting/blob-of-death` — issues: thin dialogue graph, low decision density (nodes=3, options=5, processOptions=2, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `3dprinting/cable-clip` — issues: thin dialogue graph (nodes=4, options=7, processOptions=3, gatedOptions=3).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add a quality-control checkpoint (tolerance/alignment/continuity) before finish.
- `3dprinting/calibration-cube` — issues: thin dialogue graph (nodes=4, options=7, processOptions=3, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add a quality-control checkpoint (tolerance/alignment/continuity) before finish.
- `3dprinting/filament-change` — issues: thin dialogue graph, low decision density (nodes=4, options=5, processOptions=1, gatedOptions=4).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `3dprinting/nozzle-cleaning` — issues: thin dialogue graph, low decision density (nodes=3, options=5, processOptions=2, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `3dprinting/nozzle-clog` — issues: thin dialogue graph (nodes=4, options=7, processOptions=3, gatedOptions=6).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add a quality-control checkpoint (tolerance/alignment/continuity) before finish.
- `3dprinting/phone-stand` — issues: thin dialogue graph (nodes=4, options=7, processOptions=3, gatedOptions=3).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add a quality-control checkpoint (tolerance/alignment/continuity) before finish.
- `3dprinting/retraction-test` — issues: thin dialogue graph (nodes=4, options=6, processOptions=1, gatedOptions=4).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add a quality-control checkpoint (tolerance/alignment/continuity) before finish.
- `3dprinting/spool-holder` — issues: thin dialogue graph (nodes=4, options=8, processOptions=4, gatedOptions=4).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add a quality-control checkpoint (tolerance/alignment/continuity) before finish.
- `3dprinting/temperature-tower` — issues: thin dialogue graph, low decision density (nodes=4, options=5, processOptions=1, gatedOptions=4).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `3dprinting/x-belt-tension` — issues: thin dialogue graph, low decision density (nodes=3, options=4, processOptions=1, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `3dprinting/benchy_10` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=4, options=4, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `3dprinting/benchy_100` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=4, options=4, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `3dprinting/benchy_25` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=4, options=4, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.

### aquaria (19)
- `aquaria/aquarium-light` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=4, options=4, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `aquaria/balance-ph` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=4, options=5, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `aquaria/breeding` — issues: thin dialogue graph (nodes=4, options=8, processOptions=3, gatedOptions=6).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `aquaria/filter-rinse` — issues: thin dialogue graph (nodes=4, options=7, processOptions=3, gatedOptions=5).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `aquaria/floating-plants` — issues: thin dialogue graph (nodes=4, options=7, processOptions=3, gatedOptions=5).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `aquaria/guppy` — issues: thin dialogue graph (nodes=4, options=7, processOptions=2, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `aquaria/heater-install` — issues: thin dialogue graph (nodes=4, options=6, processOptions=2, gatedOptions=3).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `aquaria/log-water-parameters` — issues: thin dialogue graph (nodes=4, options=6, processOptions=2, gatedOptions=5).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `aquaria/net-fish` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=4, options=4, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `aquaria/ph-strip-test` — issues: thin dialogue graph (nodes=4, options=7, processOptions=2, gatedOptions=5).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `aquaria/position-tank` — issues: thin dialogue graph, low decision density (nodes=4, options=5, processOptions=1, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `aquaria/shrimp` — issues: thin dialogue graph, low decision density (nodes=4, options=5, processOptions=1, gatedOptions=3).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `aquaria/sponge-filter` — issues: needs manual parity pass against QA exemplars (nodes=5, options=8, processOptions=3, gatedOptions=4).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `aquaria/thermometer` — issues: thin dialogue graph (nodes=4, options=6, processOptions=2, gatedOptions=3).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `aquaria/top-off` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=4, options=4, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `aquaria/walstad` — issues: needs manual parity pass against QA exemplars (nodes=5, options=7, processOptions=2, gatedOptions=4).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `aquaria/water-change` — issues: thin dialogue graph (nodes=4, options=6, processOptions=2, gatedOptions=3).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `aquaria/water-testing` — issues: thin dialogue graph, low decision density (nodes=3, options=4, processOptions=1, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `aquaria/goldfish` — issues: needs manual parity pass against QA exemplars (nodes=6, options=11, processOptions=4, gatedOptions=2).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] log baseline vs after-action measurements and gate on the delta.

### astronomy (21)
- `astronomy/andromeda` — issues: thin dialogue graph, low decision density (nodes=3, options=4, processOptions=1, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `astronomy/aurora-watch` — issues: needs manual parity pass against QA exemplars (nodes=5, options=8, processOptions=3, gatedOptions=3).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `astronomy/basic-telescope` — issues: thin dialogue graph, low decision density (nodes=3, options=4, processOptions=1, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `astronomy/binary-star` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `astronomy/comet-tracking` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `astronomy/constellations` — issues: thin dialogue graph (nodes=4, options=6, processOptions=2, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `astronomy/iss-flyover` — issues: needs manual parity pass against QA exemplars (nodes=5, options=8, processOptions=3, gatedOptions=3).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `astronomy/iss-photo` — issues: thin dialogue graph, low decision density (nodes=4, options=5, processOptions=1, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `astronomy/jupiter-moons` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `astronomy/light-pollution` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `astronomy/lunar-eclipse` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `astronomy/meteor-shower` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `astronomy/north-star` — issues: thin dialogue graph, low decision density (nodes=4, options=5, processOptions=1, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `astronomy/observe-moon` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `astronomy/orion-nebula` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `astronomy/planetary-alignment` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=5, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `astronomy/satellite-pass` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `astronomy/saturn-rings` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `astronomy/star-trails` — issues: thin dialogue graph, no process-backed evidence (nodes=4, options=6, processOptions=0, gatedOptions=4).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add a process step that generates an observable artifact used by a gate.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `astronomy/sunspot-sketch` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `astronomy/venus-phases` — issues: thin dialogue graph (nodes=4, options=6, processOptions=2, gatedOptions=3).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] log baseline vs after-action measurements and gate on the delta.

### chemistry (10)
- `chemistry/acid-dilution` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `chemistry/acid-neutralization` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=4, options=5, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `chemistry/buffer-solution` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `chemistry/ph-adjustment` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `chemistry/ph-test` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `chemistry/precipitation-reaction` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `chemistry/safe-reaction` — issues: thin dialogue graph (nodes=4, options=6, processOptions=2, gatedOptions=3).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
- `chemistry/stevia-crystals` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `chemistry/stevia-extraction` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `chemistry/stevia-tasting` — issues: thin dialogue graph, no process-backed evidence (nodes=4, options=6, processOptions=0, gatedOptions=4).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add a process step that generates an observable artifact used by a gate.
  - [ ] differentiate rewards with domain-specific grants or unlock links.

### completionist (5)
- `completionist/catalog` — issues: thin dialogue graph, low decision density (nodes=3, options=4, processOptions=1, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `completionist/display` — issues: thin dialogue graph (nodes=4, options=6, processOptions=2, gatedOptions=3).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] replace passive completion checks with multi-tree evidence requirements.
- `completionist/polish` — issues: thin dialogue graph, low decision density (nodes=3, options=4, processOptions=1, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `completionist/reminder` — issues: thin dialogue graph, low decision density (nodes=3, options=4, processOptions=1, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `completionist/v2` — issues: needs manual parity pass against QA exemplars (nodes=6, options=10, processOptions=4, gatedOptions=4).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] replace passive completion checks with multi-tree evidence requirements.

### devops (15)
- `devops/auto-updates` — issues: thin dialogue graph, no process-backed evidence (nodes=4, options=6, processOptions=0, gatedOptions=4).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add a process step that generates an observable artifact used by a gate.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `devops/ci-pipeline` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `devops/daily-backups` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `devops/docker-compose` — issues: thin dialogue graph, low decision density (nodes=3, options=5, processOptions=2, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `devops/enable-https` — issues: thin dialogue graph, no process-backed evidence (nodes=4, options=6, processOptions=0, gatedOptions=4).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add a process step that generates an observable artifact used by a gate.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `devops/fail2ban` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `devops/firewall-rules` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `devops/k3s-deploy` — issues: weak gated proof (nodes=5, options=6, processOptions=1, gatedOptions=1).
  - [ ] require at least two gated checkpoints across setup and verification.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
- `devops/log-maintenance` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `devops/monitoring` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `devops/pi-cluster-hardware` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `devops/prepare-first-node` — issues: thin dialogue graph, low decision density (nodes=4, options=5, processOptions=1, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `devops/private-registry` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `devops/ssd-boot` — issues: thin dialogue graph (nodes=4, options=6, processOptions=2, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
- `devops/ssh-hardening` — issues: thin dialogue graph (nodes=4, options=6, processOptions=2, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.

### electronics (22)
- `electronics/arduino-blink` — issues: thin dialogue graph, weak gated proof (nodes=4, options=6, processOptions=2, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] require at least two gated checkpoints across setup and verification.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `electronics/basic-circuit` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=4, options=4, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `electronics/check-battery-voltage` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `electronics/continuity-test` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `electronics/data-logger` — issues: thin dialogue graph, weak gated proof (nodes=4, options=6, processOptions=2, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] require at least two gated checkpoints across setup and verification.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `electronics/desolder-component` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=4, options=4, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `electronics/led-polarity` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `electronics/light-sensor` — issues: needs manual parity pass against QA exemplars (nodes=5, options=6, processOptions=1, gatedOptions=2).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
  - [ ] add a quality-control checkpoint (tolerance/alignment/continuity) before finish.
- `electronics/measure-arduino-5v` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=4, options=4, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `electronics/measure-led-current` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=4, options=4, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `electronics/measure-resistance` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `electronics/potentiometer-dimmer` — issues: weak gated proof (nodes=5, options=7, processOptions=2, gatedOptions=1).
  - [ ] require at least two gated checkpoints across setup and verification.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
- `electronics/resistor-color-check` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `electronics/servo-sweep` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=4, options=5, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `electronics/solder-led-harness` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `electronics/solder-wire` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=5, processOptions=2, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `electronics/soldering-intro` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `electronics/temperature-plot` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=4, options=4, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `electronics/test-gfci-outlet` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `electronics/thermistor-reading` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=4, options=5, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `electronics/thermometer-calibration` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `electronics/voltage-divider` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=4, options=5, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.

### energy (21)
- `energy/battery-maintenance` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `energy/battery-upgrade` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `energy/biogas-digester` — issues: thin dialogue graph, weak gated proof (nodes=4, options=6, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] require at least two gated checkpoints across setup and verification.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `energy/charge-controller-setup` — issues: needs manual parity pass against QA exemplars (nodes=6, options=10, processOptions=3, gatedOptions=4).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `energy/dWatt-1e8` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `energy/hand-crank-generator` — issues: needs manual parity pass against QA exemplars (nodes=6, options=10, processOptions=4, gatedOptions=5).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `energy/offgrid-charger` — issues: needs manual parity pass against QA exemplars (nodes=7, options=12, processOptions=4, gatedOptions=6).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `energy/portable-solar-panel` — issues: needs manual parity pass against QA exemplars (nodes=5, options=8, processOptions=2, gatedOptions=3).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `energy/power-inverter` — issues: needs manual parity pass against QA exemplars (nodes=5, options=7, processOptions=2, gatedOptions=3).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `energy/solar-tracker` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=5, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `energy/wind-turbine` — issues: thin dialogue graph (nodes=4, options=6, processOptions=2, gatedOptions=3).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
- `energy/dSolar-100kW` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `energy/dSolar-10kW` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `energy/dSolar-1kW` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `energy/dWatt-1e3` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `energy/dWatt-1e4` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `energy/dWatt-1e5` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `energy/dWatt-1e6` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `energy/dWatt-1e7` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `energy/solar` — issues: needs manual parity pass against QA exemplars (nodes=6, options=9, processOptions=2, gatedOptions=3).
  - [ ] add explicit failure-mode handling and safe rollback language.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `energy/solar-1kWh` — issues: weak gated proof (nodes=5, options=9, processOptions=3, gatedOptions=1).
  - [ ] require at least two gated checkpoints across setup and verification.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.

### firstaid (13)
- `firstaid/assemble-kit` — issues: weak gated proof (nodes=5, options=9, processOptions=3, gatedOptions=1).
  - [ ] require at least two gated checkpoints across setup and verification.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
- `firstaid/change-bandage` — issues: thin dialogue graph, low decision density (nodes=3, options=4, processOptions=1, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `firstaid/dispose-bandages` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `firstaid/dispose-expired` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=4, options=5, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `firstaid/flashlight-battery` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `firstaid/learn-cpr` — issues: thin dialogue graph, low decision density (nodes=3, options=4, processOptions=1, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `firstaid/remove-splinter` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=4, options=5, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `firstaid/restock-kit` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `firstaid/sanitize-pocket-mask` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `firstaid/splint-limb` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `firstaid/stop-nosebleed` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `firstaid/treat-burn` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `firstaid/wound-care` — issues: thin dialogue graph, low decision density (nodes=3, options=4, processOptions=1, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.

### geothermal (15)
- `geothermal/backflush-loop-filter` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=4, options=5, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `geothermal/calibrate-ground-sensor` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `geothermal/check-loop-inlet-temp` — issues: needs manual parity pass against QA exemplars (nodes=5, options=9, processOptions=2, gatedOptions=7).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `geothermal/check-loop-outlet-temp` — issues: thin dialogue graph (nodes=4, options=7, processOptions=2, gatedOptions=6).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
- `geothermal/check-loop-pressure` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=0).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `geothermal/check-loop-temp-delta` — issues: needs manual parity pass against QA exemplars (nodes=6, options=11, processOptions=4, gatedOptions=10).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `geothermal/compare-depth-ground-temps` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `geothermal/compare-seasonal-ground-temps` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `geothermal/install-backup-thermistor` — issues: thin dialogue graph, low decision density, no process-backed evidence (nodes=4, options=5, processOptions=0, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `geothermal/log-ground-temperature` — issues: needs manual parity pass against QA exemplars (nodes=5, options=9, processOptions=3, gatedOptions=7).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `geothermal/log-heat-pump-warmup` — issues: thin dialogue graph (nodes=4, options=8, processOptions=3, gatedOptions=7).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
- `geothermal/monitor-heat-pump-energy` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=4, options=5, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `geothermal/purge-loop-air` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=4, options=5, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `geothermal/replace-faulty-thermistor` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `geothermal/survey-ground-temperature` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=4, options=5, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.

### hydroponics (21)
- `hydroponics/air-stone-soak` — issues: thin dialogue graph (nodes=4, options=6, processOptions=2, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `hydroponics/ec-calibrate` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `hydroponics/ec-check` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `hydroponics/filter-clean` — issues: needs manual parity pass against QA exemplars (nodes=5, options=7, processOptions=2, gatedOptions=3).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `hydroponics/grow-light` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `hydroponics/lettuce` — issues: needs manual parity pass against QA exemplars (nodes=6, options=11, processOptions=4, gatedOptions=5).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `hydroponics/mint-cutting` — issues: thin dialogue graph, low decision density (nodes=3, options=4, processOptions=1, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `hydroponics/netcup-clean` — issues: needs manual parity pass against QA exemplars (nodes=6, options=11, processOptions=4, gatedOptions=4).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `hydroponics/ph-check` — issues: needs manual parity pass against QA exemplars (nodes=5, options=9, processOptions=3, gatedOptions=2).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `hydroponics/ph-test` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `hydroponics/plug-soak` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `hydroponics/pump-install` — issues: needs manual parity pass against QA exemplars (nodes=5, options=7, processOptions=2, gatedOptions=3).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `hydroponics/pump-prime` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=0).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `hydroponics/regrow-stevia` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `hydroponics/reservoir-refresh` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `hydroponics/root-rinse` — issues: thin dialogue graph (nodes=4, options=6, processOptions=2, gatedOptions=3).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `hydroponics/stevia` — issues: thin dialogue graph (nodes=4, options=7, processOptions=3, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] log baseline vs after-action measurements and gate on the delta.
- `hydroponics/temp-check` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `hydroponics/top-off` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `hydroponics/tub-scrub` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `hydroponics/bucket_10` — issues: needs manual parity pass against QA exemplars (nodes=5, options=7, processOptions=2, gatedOptions=3).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] log baseline vs after-action measurements and gate on the delta.

### programming (18)
- `programming/avg-temp` — issues: thin dialogue graph (nodes=4, options=6, processOptions=2, gatedOptions=3).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
- `programming/graph-temp` — issues: thin dialogue graph, low decision density (nodes=3, options=4, processOptions=1, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `programming/graph-temp-data` — issues: thin dialogue graph, low decision density (nodes=3, options=4, processOptions=1, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `programming/hello-sensor` — issues: needs manual parity pass against QA exemplars (nodes=5, options=8, processOptions=3, gatedOptions=3).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
  - [ ] attach verifiable output artifacts (logs, endpoint responses, command output).
- `programming/http-post` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `programming/json-api` — issues: thin dialogue graph (nodes=4, options=6, processOptions=2, gatedOptions=3).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
- `programming/json-endpoint` — issues: thin dialogue graph (nodes=4, options=7, processOptions=3, gatedOptions=3).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
- `programming/median-temp` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `programming/moving-avg-temp` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `programming/plot-temp-cli` — issues: thin dialogue graph, low decision density (nodes=3, options=4, processOptions=1, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `programming/stddev-temp` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `programming/temp-alert` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `programming/temp-email` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `programming/temp-graph` — issues: thin dialogue graph, low decision density (nodes=3, options=4, processOptions=1, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `programming/temp-json-api` — issues: thin dialogue graph, low decision density (nodes=3, options=4, processOptions=1, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `programming/temp-logger` — issues: thin dialogue graph (nodes=4, options=6, processOptions=2, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
- `programming/thermistor-calibration` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=4, options=4, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `programming/web-server` — issues: thin dialogue graph, low decision density (nodes=4, options=5, processOptions=1, gatedOptions=3).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.

### robotics (13)
- `robotics/gyro-balance` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `robotics/line-follower` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `robotics/maze-navigation` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `robotics/obstacle-avoidance` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `robotics/odometry-basics` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `robotics/pan-tilt` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `robotics/reflectance-sensors` — issues: thin dialogue graph (nodes=4, options=6, processOptions=2, gatedOptions=3).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
- `robotics/servo-arm` — issues: thin dialogue graph (nodes=4, options=6, processOptions=2, gatedOptions=3).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
- `robotics/servo-control` — issues: thin dialogue graph (nodes=4, options=6, processOptions=2, gatedOptions=3).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
- `robotics/servo-gripper` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `robotics/servo-radar` — issues: thin dialogue graph, low decision density (nodes=3, options=5, processOptions=2, gatedOptions=3).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `robotics/ultrasonic-rangefinder` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=4, options=4, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `robotics/wheel-encoders` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.

### rocketry (10)
- `rocketry/fuel-mixture` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=4, options=4, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `rocketry/guided-rocket-build` — issues: needs manual parity pass against QA exemplars (nodes=7, options=12, processOptions=5, gatedOptions=5).
  - [ ] add explicit failure-mode handling and safe rollback language.
- `rocketry/night-launch` — issues: thin dialogue graph, low decision density (nodes=4, options=5, processOptions=1, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `rocketry/preflight-check` — issues: thin dialogue graph, low decision density (nodes=4, options=5, processOptions=1, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `rocketry/recovery-run` — issues: thin dialogue graph, low decision density (nodes=4, options=5, processOptions=1, gatedOptions=2).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
- `rocketry/static-test` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `rocketry/suborbital-hop` — issues: needs manual parity pass against QA exemplars (nodes=7, options=11, processOptions=4, gatedOptions=5).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
- `rocketry/wind-check` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=4, options=5, processOptions=1, gatedOptions=0).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `rocketry/firstlaunch` — issues: needs manual parity pass against QA exemplars (nodes=10, options=17, processOptions=6, gatedOptions=4).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
- `rocketry/parachute` — issues: thin dialogue graph (nodes=4, options=6, processOptions=2, gatedOptions=3).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add explicit failure-mode handling and safe rollback language.

### ubi (3)
- `ubi/first-payment` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=3, options=4, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.
- `ubi/reminder` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=3, options=3, processOptions=0, gatedOptions=0).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `ubi/savings-goal` — issues: thin dialogue graph, low decision density, weak gated proof (nodes=4, options=5, processOptions=1, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] require at least two gated checkpoints across setup and verification.

### woodworking (10)
- `woodworking/apply-finish` — issues: no process-backed evidence, weak gated proof (nodes=6, options=11, processOptions=0, gatedOptions=1).
  - [ ] add a process step that generates an observable artifact used by a gate.
  - [ ] require at least two gated checkpoints across setup and verification.
  - [ ] add explicit failure-mode handling and safe rollback language.
- `woodworking/birdhouse` — issues: needs manual parity pass against QA exemplars (nodes=7, options=15, processOptions=3, gatedOptions=4).
  - [ ] differentiate rewards with domain-specific grants or unlock links.
  - [ ] add explicit failure-mode handling and safe rollback language.
  - [ ] add a quality-control checkpoint (tolerance/alignment/continuity) before finish.
- `woodworking/bookshelf` — issues: thin dialogue graph, no process-backed evidence, weak gated proof (nodes=4, options=6, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add a process step that generates an observable artifact used by a gate.
  - [ ] require at least two gated checkpoints across setup and verification.
- `woodworking/coffee-table` — issues: thin dialogue graph, low decision density, no process-backed evidence, weak gated proof (nodes=4, options=5, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add an alternate path with tradeoffs (speed vs safety, quality vs cost).
  - [ ] add a process step that generates an observable artifact used by a gate.
- `woodworking/finish-sanding` — issues: no process-backed evidence, weak gated proof (nodes=6, options=11, processOptions=0, gatedOptions=1).
  - [ ] add a process step that generates an observable artifact used by a gate.
  - [ ] require at least two gated checkpoints across setup and verification.
  - [ ] add explicit failure-mode handling and safe rollback language.
- `woodworking/picture-frame` — issues: no process-backed evidence, weak gated proof (nodes=6, options=11, processOptions=0, gatedOptions=1).
  - [ ] add a process step that generates an observable artifact used by a gate.
  - [ ] require at least two gated checkpoints across setup and verification.
  - [ ] add explicit failure-mode handling and safe rollback language.
- `woodworking/planter-box` — issues: weak gated proof (nodes=8, options=15, processOptions=1, gatedOptions=1).
  - [ ] require at least two gated checkpoints across setup and verification.
  - [ ] add explicit failure-mode handling and safe rollback language.
  - [ ] add a quality-control checkpoint (tolerance/alignment/continuity) before finish.
- `woodworking/step-stool` — issues: thin dialogue graph, no process-backed evidence, weak gated proof (nodes=4, options=6, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add a process step that generates an observable artifact used by a gate.
  - [ ] require at least two gated checkpoints across setup and verification.
- `woodworking/tool-rack` — issues: no process-backed evidence (nodes=7, options=13, processOptions=0, gatedOptions=2).
  - [ ] add a process step that generates an observable artifact used by a gate.
  - [ ] add explicit failure-mode handling and safe rollback language.
  - [ ] add a quality-control checkpoint (tolerance/alignment/continuity) before finish.
- `woodworking/workbench` — issues: thin dialogue graph, no process-backed evidence, weak gated proof (nodes=4, options=6, processOptions=0, gatedOptions=1).
  - [ ] add one recovery/troubleshooting branch before completion.
  - [ ] add a process step that generates an observable artifact used by a gate.
  - [ ] require at least two gated checkpoints across setup and verification.

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
