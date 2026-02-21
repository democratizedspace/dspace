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

Use this as an actionable backlog for quest polishing passes. This section enumerates **every unchecked quest that is also listed as new in v3**.

- Newly added in v3 (`docs/new-quests.md`): **236**
- Checked in `docs/qa/v3.md` §4.5 that are also new in v3: **15**
- Remaining newly added v3 quests with quality gaps to prioritize: **221**

### How this list is generated / verified

- Source-of-truth set A: quest IDs listed in `docs/new-quests.md`.
- Source-of-truth set B: checked IDs from `docs/qa/v3.md` §4.5 (`- [x]` quest rows under each tree).
- Intersection rule for this backlog: **new in v3 AND unchecked** = (`docs/new-quests.md`) ∩ (unchecked IDs in `docs/qa/v3.md` §4.5).
- Reproduction recipe (manual, copy/paste):
  1. `rg -n "^### |^\s*-\s+[a-z0-9_-]+/[a-z0-9_-]+$" docs/new-quests.md`
  2. `sed -n "/^### 4.5 /,/^---$/p" docs/qa/v3.md`
  3. `python -c 'import pathlib,re; qa=pathlib.Path("docs/qa/v3.md").read_text().splitlines(); new=pathlib.Path("docs/new-quests.md").read_text().splitlines(); in45=False; t=None; checked=set(); unchecked=set();\
for line in qa:\
    in45 = in45 or line.startswith("### 4.5 ");\
    if in45 and line.startswith("---"): break;\
    m_tree=re.match(r"- \[[ xX]\] ([a-z0-9_-]+)$", line);\
    m_q=re.match(r"\s{2}- \[([ xX])\] ([a-z0-9_-]+)$", line);\
    t = m_tree.group(1) if m_tree else t;\
    q=f"{t}/{m_q.group(2)}" if (m_q and t) else None;\
    (checked if (m_q and m_q.group(1).lower()=="x") else unchecked).add(q) if q else None;\
new_ids={m.group(1) for row in new if (m:=re.match(r"\s*-\s+([a-z0-9_-]+/[a-z0-9_-]+)$", row))}; print("new",len(new_ids),"checked_and_new",len(new_ids & checked),"prioritized_backlog",len(new_ids & unchecked))'`
  4. This is explicitly a manual verification method (no dedicated repo script currently exists for this exact intersection query).

### Completeness check

- Confirm each tree under `frontend/src/pages/quests/json/` appears as a `### <tree>` heading **when** it has at least one `new in v3 AND unchecked` quest.
- Confirm per-tree heading counts match the number of quest IDs listed under each heading.
- Confirm totals equation: **(new-in-v3 count) - (checked-and-new-in-v3 count) = (prioritized backlog count)**, i.e. **236 - 15 = 221**.

Checklist rubric (type-driven, applied by quest ID keyword; first keyword match wins):

- install/setup (`install`, `setup`, `deploy`, `enable`, `configure`)
- measure/test/check (`check`, `test`, `measure`, `voltage`, `pressure`, `temp`, `ph`, `ec`)
- calibrate/adjust (`calibrate`, `leveling`, `tension`, `retraction`, `trim`)
- log/monitor/maintenance (`log`, `monitor`, `maintenance`)
- clean/rinse/purge/prime/scrub (`clean`, `rinse`, `purge`, `prime`, `scrub`)
- grow/lifecycle/outcome (`breeding`, `lettuce`, `stevia`, `basil`, `mint`, `shrimp`, `guppy`, `goldfish`, `walstad`)
- astronomy observation (`observe`, `eclipse`, `meteor`, `rings`, `nebula`, `aurora`, `satellite`, `iss`)
- fallback/default (when no keyword above matches)

Hard rule: exemplar anchors must be chosen **only** from checked quest IDs in `docs/qa/v3.md` §4.5 and must be stable quest IDs (no invented anchors).

Fallback policy: if a tree has no checked quests in `docs/qa/v3.md` §4.5, list **exactly two** cross-tree checked anchors and append `(fallback: no checked <tree> quests yet)`.

### 3dprinting (15 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): hydroponics/nutrient-check, composting/check-temperature (fallback: no checked 3dprinting quests yet)

- `3dprinting/bed-leveling`
  - [x] Observed issue (addressed): `3dprinting/bed-leveling` previously implied calibration work, but baseline/adjust/retest tolerance handling was under-specified; this was hardened in this pass. (PR #3608)
  - [x] Structure progression as baseline → adjust → re-test with a tolerance target and artifacts captured at baseline and post-adjust states. (PR #3608)
  - [x] Add a drift/variance follow-up branch that rolls back to last-known-good settings when readings do not hold. (PR #3608)
- `3dprinting/benchy_10`
  - [x] Observed issue (addressed): `3dprinting/benchy_10` previously trended toward thin-shell progression with limited decision points and weak intermediate proof gates; this was hardened in this pass. (PR #3613)
  - [x] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output). (PR #3613)
  - [x] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`. (PR #3613)
- `3dprinting/benchy_100`
  - [ ] Observed issue: `3dprinting/benchy_100` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `3dprinting/benchy_25`
  - [x] Observed issue (addressed): `3dprinting/benchy_25` previously trended toward thin-shell progression with limited decision points and weak intermediate proof gates; this was hardened in this pass. (PR #3608)
  - [x] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output). (PR #3608)
  - [x] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`. (PR #3608)
- `3dprinting/blob-of-death`
  - [x] Observed issue (addressed): `3dprinting/blob-of-death` previously trended toward thin-shell progression with limited decision points and weak intermediate proof gates; this was hardened in this pass. (PR #3613)
  - [x] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output). (PR #3613)
  - [x] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`. (PR #3613)
- `3dprinting/cable-clip`
  - [ ] Observed issue: `3dprinting/cable-clip` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `3dprinting/calibration-cube`
  - [ ] Observed issue: `3dprinting/calibration-cube` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `3dprinting/filament-change`
  - [x] Observed issue (addressed): `3dprinting/filament-change` previously trended toward thin-shell progression with limited decision points and weak intermediate proof gates; this was hardened in PR #3590. (PR #3590)
  - [x] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output). (PR #3590)
  - [x] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`. (PR #3590)
- `3dprinting/nozzle-cleaning`
  - [x] Observed issue (addressed): `3dprinting/nozzle-cleaning` previously described a cleaning cycle without a measurable before/after success definition; this was hardened in PR #3590. (PR #3590)
  - [x] Gate completion on paired pre/post artifacts that prove the state change (flow, residue, clarity, or equivalent). (PR #3590)
  - [x] Add a contamination/failure branch with a safe re-entry checkpoint and repeat-until-pass loop. (PR #3590)
- `3dprinting/nozzle-clog`
  - [x] Observed issue (addressed): `3dprinting/nozzle-clog` previously asked for logging/monitoring but pass criteria and anomaly response were not explicit; this was hardened in PR #3590 and #3594. (PR #3590, #3594)
  - [x] Define required log fields/cadence/thresholds and gate completion on the produced log or monitoring snapshot artifact. (PR #3590, #3594)
  - [x] Add an anomaly classification branch with corrective action and a follow-up verification window before closure. (PR #3590, #3594)
- `3dprinting/phone-stand`
  - [x] Observed issue (addressed): `3dprinting/phone-stand` previously centered on a measurement/check action, but acceptance thresholds and out-of-range handling were thin; this was hardened in this pass. (PR #3608)
  - [x] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock. (PR #3608)
  - [x] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds. (PR #3608)
- `3dprinting/retraction-test`
  - [x] Observed issue (addressed): `3dprinting/retraction-test` previously centered on a measurement/check action but acceptance thresholds and out-of-range handling were thin; this was hardened in this pass. (PR #3613)
  - [x] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock. (PR #3613)
  - [x] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds. (PR #3613)
- `3dprinting/spool-holder`
  - [x] Observed issue (addressed): `3dprinting/spool-holder` previously trended toward thin-shell progression with limited decision points and weak intermediate proof gates; this was hardened in PR #3594. (PR #3594)
  - [x] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output). (PR #3594)
  - [x] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`. (PR #3594)
- `3dprinting/temperature-tower`
  - [x] Observed issue (addressed): `3dprinting/temperature-tower` previously centered on a measurement/check action but lacked explicit acceptance thresholds and out-of-range handling; this was hardened in PR #3594. (PR #3594)
  - [x] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock. (PR #3594)
  - [x] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds. (PR #3594)
- `3dprinting/x-belt-tension`
  - [x] Observed issue (addressed): `3dprinting/x-belt-tension` previously implied calibration work, but baseline/adjust/retest tolerance handling was under-specified; this was hardened in PR #3590. (PR #3590)
  - [x] Structure progression as baseline → adjust → re-test with a tolerance target and artifacts captured at baseline and post-adjust states. (PR #3590)
  - [x] Add a drift/variance follow-up branch that rolls back to last-known-good settings when readings do not hold. (PR #3590)

### aquaria (19 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): hydroponics/nutrient-check, composting/check-temperature

- `aquaria/aquarium-light`
  - [ ] Observed issue: `aquaria/aquarium-light` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `aquaria/balance-ph`
  - [x] Observed issue: `aquaria/balance-ph` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin. (PR #3609)
  - [x] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock. (PR #3609)
  - [x] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds. (PR #3609)
- `aquaria/breeding`
  - [x] Observed issue: `aquaria/breeding` is lifecycle-oriented but can read as narration unless staged setup and outcome proofs are separated. (PR #3609)
  - [x] Require staged evidence gates: one setup artifact first, then an outcome artifact before `finish`. (PR #3609)
  - [x] Add a stress/failure contingency branch with concrete pause/abort criteria and timed re-check before resuming. (PR #3609)
- `aquaria/filter-rinse`
  - [x] Observed issue: `aquaria/filter-rinse` describes a cleaning cycle without a measurable before/after success definition. (PR #3609)
  - [x] Gate completion on paired pre/post artifacts that prove the state change (flow, residue, clarity, or equivalent). (PR #3609)
  - [x] Add a contamination/failure branch with a safe re-entry checkpoint and repeat-until-pass loop. (PR #3609)
- `aquaria/floating-plants`
  - [ ] Observed issue: `aquaria/floating-plants` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `aquaria/goldfish`
  - [x] Observed issue: `aquaria/goldfish` is lifecycle-oriented but can read as narration unless staged setup and outcome proofs are separated. (PR #3627)
  - [x] Require staged evidence gates: one setup artifact first, then an outcome artifact before `finish`. (PR #3627)
  - [x] Add a stress/failure contingency branch with concrete pause/abort criteria and timed re-check before resuming. (PR #3627)
- `aquaria/guppy`
  - [x] Observed issue: `aquaria/guppy` is lifecycle-oriented but can read as narration unless staged setup and outcome proofs are separated. (PR #3636)
  - [x] Require staged evidence gates: one setup artifact first, then an outcome artifact before `finish`. (PR #3636)
  - [x] Add a stress/failure contingency branch with concrete pause/abort criteria and timed re-check before resuming. (PR #3636)
- `aquaria/heater-install`
  - [x] Observed issue: `aquaria/heater-install` reads like a one-pass install task, with verify/rollback state changes not clearly represented. (PR #3620)
  - [x] Apply install → verify → rollback sequencing in separate nodes and gate completion on a concrete verification artifact (status output, log snapshot, or expected-state item). (PR #3620)
  - [x] Add rollback/lockout-avoidance handling with a re-verify checkpoint before retrying the install path. (PR #3620)
- `aquaria/log-water-parameters`
  - [x] Observed issue: `aquaria/log-water-parameters` asks for logging/monitoring but pass criteria and anomaly response are not explicit. (PR #3620)
  - [x] Define required log fields/cadence/thresholds and gate completion on the produced log or monitoring snapshot artifact. (PR #3620)
  - [x] Add an anomaly classification branch with corrective action and a follow-up verification window before closure. (PR #3620)
- `aquaria/net-fish`
  - [ ] Observed issue: `aquaria/net-fish` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `aquaria/ph-strip-test`
  - [x] Observed issue: `aquaria/ph-strip-test` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin. (PR #3620)
  - [x] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock. (PR #3620)
  - [x] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds. (PR #3620)
- `aquaria/position-tank`
  - [ ] Observed issue: `aquaria/position-tank` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `aquaria/shrimp`
  - [ ] Observed issue: `aquaria/shrimp` is lifecycle-oriented but can read as narration unless staged setup and outcome proofs are separated.
  - [ ] Require staged evidence gates: one setup artifact first, then an outcome artifact before `finish`.
  - [ ] Add a stress/failure contingency branch with concrete pause/abort criteria and timed re-check before resuming.
- `aquaria/sponge-filter`
  - [x] Observed issue: `aquaria/sponge-filter` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates. (PR #3627)
  - [x] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output). (PR #3627)
  - [x] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`. (PR #3627)
- `aquaria/thermometer`
  - [x] Observed issue: `aquaria/thermometer` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates. (PR #3636)
  - [x] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output). (PR #3636)
  - [x] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`. (PR #3636)
- `aquaria/top-off`
  - [x] Observed issue: `aquaria/top-off` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates. (PR #3636)
  - [x] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output). (PR #3636)
  - [x] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`. (PR #3636)
- `aquaria/walstad`
  - [ ] Observed issue: `aquaria/walstad` is lifecycle-oriented but can read as narration unless staged setup and outcome proofs are separated.
  - [ ] Require staged evidence gates: one setup artifact first, then an outcome artifact before `finish`.
  - [ ] Add a stress/failure contingency branch with concrete pause/abort criteria and timed re-check before resuming.
- `aquaria/water-change`
  - [ ] Observed issue: `aquaria/water-change` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `aquaria/water-testing`
  - [x] Observed issue: `aquaria/water-testing` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin. (PR #3627)
  - [x] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock. (PR #3627)
  - [x] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds. (PR #3627)

### astronomy (21 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): sysadmin/resource-monitoring, composting/check-temperature (fallback: no checked astronomy quests yet)

- `astronomy/andromeda`
  - [ ] Observed issue: `astronomy/andromeda` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `astronomy/aurora-watch`
  - [ ] Observed issue: `astronomy/aurora-watch` is observation-heavy but fallback handling for seeing/weather constraints is typically thin.
  - [ ] Add a seeing/weather/light-pollution fallback branch plus an observation artifact gate (log, sketch, or photo surrogate) with interpretation.
  - [ ] Include failed-session troubleshooting and a scheduled follow-up observation check before completion.
- `astronomy/basic-telescope`
  - [ ] Observed issue: `astronomy/basic-telescope` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `astronomy/binary-star`
  - [ ] Observed issue: `astronomy/binary-star` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `astronomy/comet-tracking`
  - [ ] Observed issue: `astronomy/comet-tracking` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `astronomy/constellations`
  - [ ] Observed issue: `astronomy/constellations` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `astronomy/iss-flyover`
  - [ ] Observed issue: `astronomy/iss-flyover` is observation-heavy but fallback handling for seeing/weather constraints is typically thin.
  - [ ] Add a seeing/weather/light-pollution fallback branch plus an observation artifact gate (log, sketch, or photo surrogate) with interpretation.
  - [ ] Include failed-session troubleshooting and a scheduled follow-up observation check before completion.
- `astronomy/iss-photo`
  - [ ] Observed issue: `astronomy/iss-photo` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds.
- `astronomy/jupiter-moons`
  - [ ] Observed issue: `astronomy/jupiter-moons` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `astronomy/light-pollution`
  - [ ] Observed issue: `astronomy/light-pollution` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `astronomy/lunar-eclipse`
  - [ ] Observed issue: `astronomy/lunar-eclipse` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds.
- `astronomy/meteor-shower`
  - [ ] Observed issue: `astronomy/meteor-shower` is observation-heavy but fallback handling for seeing/weather constraints is typically thin.
  - [ ] Add a seeing/weather/light-pollution fallback branch plus an observation artifact gate (log, sketch, or photo surrogate) with interpretation.
  - [ ] Include failed-session troubleshooting and a scheduled follow-up observation check before completion.
- `astronomy/north-star`
  - [ ] Observed issue: `astronomy/north-star` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `astronomy/observe-moon`
  - [ ] Observed issue: `astronomy/observe-moon` is observation-heavy but fallback handling for seeing/weather constraints is typically thin.
  - [ ] Add a seeing/weather/light-pollution fallback branch plus an observation artifact gate (log, sketch, or photo surrogate) with interpretation.
  - [ ] Include failed-session troubleshooting and a scheduled follow-up observation check before completion.
- `astronomy/orion-nebula`
  - [ ] Observed issue: `astronomy/orion-nebula` is observation-heavy but fallback handling for seeing/weather constraints is typically thin.
  - [ ] Add a seeing/weather/light-pollution fallback branch plus an observation artifact gate (log, sketch, or photo surrogate) with interpretation.
  - [ ] Include failed-session troubleshooting and a scheduled follow-up observation check before completion.
- `astronomy/planetary-alignment`
  - [ ] Observed issue: `astronomy/planetary-alignment` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `astronomy/satellite-pass`
  - [ ] Observed issue: `astronomy/satellite-pass` is observation-heavy but fallback handling for seeing/weather constraints is typically thin.
  - [ ] Add a seeing/weather/light-pollution fallback branch plus an observation artifact gate (log, sketch, or photo surrogate) with interpretation.
  - [ ] Include failed-session troubleshooting and a scheduled follow-up observation check before completion.
- `astronomy/saturn-rings`
  - [ ] Observed issue: `astronomy/saturn-rings` is observation-heavy but fallback handling for seeing/weather constraints is typically thin.
  - [ ] Add a seeing/weather/light-pollution fallback branch plus an observation artifact gate (log, sketch, or photo surrogate) with interpretation.
  - [ ] Include failed-session troubleshooting and a scheduled follow-up observation check before completion.
- `astronomy/star-trails`
  - [ ] Observed issue: `astronomy/star-trails` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `astronomy/sunspot-sketch`
  - [ ] Observed issue: `astronomy/sunspot-sketch` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `astronomy/venus-phases`
  - [ ] Observed issue: `astronomy/venus-phases` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds.

### chemistry (10 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): composting/check-temperature, welcome/run-tests (fallback: no checked chemistry quests yet)

- `chemistry/acid-dilution`
  - [ ] Observed issue: `chemistry/acid-dilution` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `chemistry/acid-neutralization`
  - [ ] Observed issue: `chemistry/acid-neutralization` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `chemistry/buffer-solution`
  - [ ] Observed issue: `chemistry/buffer-solution` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `chemistry/ph-adjustment`
  - [ ] Observed issue: `chemistry/ph-adjustment` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds; include domain-appropriate safety stop conditions where risk handling is relevant.
- `chemistry/ph-test`
  - [ ] Observed issue: `chemistry/ph-test` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds; include domain-appropriate safety stop conditions where risk handling is relevant.
- `chemistry/precipitation-reaction`
  - [ ] Observed issue: `chemistry/precipitation-reaction` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds; include domain-appropriate safety stop conditions where risk handling is relevant.
- `chemistry/safe-reaction`
  - [ ] Observed issue: `chemistry/safe-reaction` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `chemistry/stevia-crystals`
  - [ ] Observed issue: `chemistry/stevia-crystals` is lifecycle-oriented but can read as narration unless staged setup and outcome proofs are separated.
  - [ ] Require staged evidence gates: one setup artifact first, then an outcome artifact before `finish`.
  - [ ] Add a stress/failure contingency branch with concrete pause/abort criteria and timed re-check before resuming; include domain-appropriate safety stop conditions where risk handling is relevant.
- `chemistry/stevia-extraction`
  - [ ] Observed issue: `chemistry/stevia-extraction` is lifecycle-oriented but can read as narration unless staged setup and outcome proofs are separated.
  - [ ] Require staged evidence gates: one setup artifact first, then an outcome artifact before `finish`.
  - [ ] Add a stress/failure contingency branch with concrete pause/abort criteria and timed re-check before resuming; include domain-appropriate safety stop conditions where risk handling is relevant.
- `chemistry/stevia-tasting`
  - [ ] Observed issue: `chemistry/stevia-tasting` is lifecycle-oriented but can read as narration unless staged setup and outcome proofs are separated.
  - [ ] Require staged evidence gates: one setup artifact first, then an outcome artifact before `finish`.
  - [ ] Add a stress/failure contingency branch with concrete pause/abort criteria and timed re-check before resuming; include domain-appropriate safety stop conditions where risk handling is relevant.

### completionist (5 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): welcome/howtodoquests, welcome/intro-inventory (fallback: no checked completionist quests yet)

- `completionist/catalog`
  - [ ] Observed issue: `completionist/catalog` asks for logging/monitoring but pass criteria and anomaly response are not explicit.
  - [ ] Define required log fields/cadence/thresholds and gate completion on the produced log or monitoring snapshot artifact.
  - [ ] Add an anomaly classification branch with corrective action and a follow-up verification window before closure.
- `completionist/display`
  - [ ] Observed issue: `completionist/display` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `completionist/polish`
  - [ ] Observed issue: `completionist/polish` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `completionist/reminder`
  - [ ] Observed issue: `completionist/reminder` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `completionist/v2`
  - [ ] Observed issue: `completionist/v2` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.

### devops (15 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): sysadmin/basic-commands, sysadmin/log-analysis (fallback: no checked devops quests yet)

- `devops/auto-updates`
  - [ ] Observed issue: `devops/auto-updates` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `devops/ci-pipeline`
  - [ ] Observed issue: `devops/ci-pipeline` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `devops/daily-backups`
  - [ ] Observed issue: `devops/daily-backups` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `devops/docker-compose`
  - [ ] Observed issue: `devops/docker-compose` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `devops/enable-https`
  - [x] Observed issue: `devops/enable-https` reads like a one-pass install task, with verify/rollback state changes not clearly represented. (PR #3619)
  - [x] Apply install → verify → rollback sequencing in separate nodes and gate completion on a concrete verification artifact (status output, log snapshot, or expected-state item). (PR #3619)
  - [x] Add rollback/lockout-avoidance handling with a re-verify checkpoint before retrying the install path; include domain-appropriate safety stop conditions where risk handling is relevant. (PR #3619)
- `devops/fail2ban`
  - [ ] Observed issue: `devops/fail2ban` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `devops/firewall-rules`
  - [x] Observed issue: `devops/firewall-rules` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates. (PR #3619)
  - [x] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output). (PR #3619)
  - [x] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant. (PR #3619)
- `devops/k3s-deploy`
  - [x] Observed issue: `devops/k3s-deploy` reads like a one-pass install task, with verify/rollback state changes not clearly represented. (PR #3632)
  - [x] Apply install → verify → rollback sequencing in separate nodes and gate completion on a concrete verification artifact (status output, log snapshot, or expected-state item). (PR #3632)
  - [x] Add rollback/lockout-avoidance handling with a re-verify checkpoint before retrying the install path; include domain-appropriate safety stop conditions where risk handling is relevant. (PR #3632)
- `devops/log-maintenance`
  - [x] Observed issue: `devops/log-maintenance` asks for logging/monitoring but pass criteria and anomaly response are not explicit. (PR #3632)
  - [x] Define required log fields/cadence/thresholds and gate completion on the produced log or monitoring snapshot artifact. (PR #3632)
  - [x] Add an anomaly classification branch with corrective action and a follow-up verification window before closure; include domain-appropriate safety stop conditions where risk handling is relevant. (PR #3632)
- `devops/monitoring`
  - [x] Observed issue: `devops/monitoring` asks for logging/monitoring but pass criteria and anomaly response are not explicit. (PR #3619)
  - [x] Define required log fields/cadence/thresholds and gate completion on the produced log or monitoring snapshot artifact. (PR #3619)
  - [x] Add an anomaly classification branch with corrective action and a follow-up verification window before closure; include domain-appropriate safety stop conditions where risk handling is relevant. (PR #3619)
- `devops/pi-cluster-hardware`
  - [ ] Observed issue: `devops/pi-cluster-hardware` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `devops/prepare-first-node`
  - [ ] Observed issue: `devops/prepare-first-node` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `devops/private-registry`
  - [ ] Observed issue: `devops/private-registry` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `devops/ssd-boot`
  - [ ] Observed issue: `devops/ssd-boot` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `devops/ssh-hardening`
  - [x] Observed issue: `devops/ssh-hardening` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates. (PR #3632)
  - [x] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output). (PR #3632)
  - [x] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant. (PR #3632)

### electronics (22 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): sysadmin/basic-commands, hydroponics/nutrient-check (fallback: no checked electronics quests yet)

- `electronics/arduino-blink`
  - [ ] Observed issue: `electronics/arduino-blink` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `electronics/basic-circuit`
  - [x] Observed issue: `electronics/basic-circuit` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates. (PR #3647)
  - [x] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output). (PR #3647)
  - [x] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant. (PR #3647)
- `electronics/check-battery-voltage`
  - [ ] Observed issue: `electronics/check-battery-voltage` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds; include domain-appropriate safety stop conditions where risk handling is relevant.
- `electronics/continuity-test`
  - [ ] Observed issue: `electronics/continuity-test` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds; include domain-appropriate safety stop conditions where risk handling is relevant.
- `electronics/data-logger`
  - [x] Observed issue: `electronics/data-logger` asks for logging/monitoring but pass criteria and anomaly response are not explicit. (PR #3647)
  - [x] Define required log fields/cadence/thresholds and gate completion on the produced log or monitoring snapshot artifact. (PR #3647)
  - [x] Add an anomaly classification branch with corrective action and a follow-up verification window before closure; include domain-appropriate safety stop conditions where risk handling is relevant. (PR #3647)
- `electronics/desolder-component`
  - [ ] Observed issue: `electronics/desolder-component` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `electronics/led-polarity`
  - [ ] Observed issue: `electronics/led-polarity` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `electronics/light-sensor`
  - [ ] Observed issue: `electronics/light-sensor` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `electronics/measure-arduino-5v`
  - [x] Observed issue: `electronics/measure-arduino-5v` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin. (PR #3647)
  - [x] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock. (PR #3647)
  - [x] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds; include domain-appropriate safety stop conditions where risk handling is relevant. (PR #3647)
- `electronics/measure-led-current`
  - [ ] Observed issue: `electronics/measure-led-current` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds; include domain-appropriate safety stop conditions where risk handling is relevant.
- `electronics/measure-resistance`
  - [ ] Observed issue: `electronics/measure-resistance` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds; include domain-appropriate safety stop conditions where risk handling is relevant.
- `electronics/potentiometer-dimmer`
  - [ ] Observed issue: `electronics/potentiometer-dimmer` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `electronics/resistor-color-check`
  - [ ] Observed issue: `electronics/resistor-color-check` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds; include domain-appropriate safety stop conditions where risk handling is relevant.
- `electronics/servo-sweep`
  - [ ] Observed issue: `electronics/servo-sweep` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `electronics/solder-led-harness`
  - [ ] Observed issue: `electronics/solder-led-harness` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `electronics/solder-wire`
  - [ ] Observed issue: `electronics/solder-wire` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `electronics/soldering-intro`
  - [ ] Observed issue: `electronics/soldering-intro` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `electronics/temperature-plot`
  - [ ] Observed issue: `electronics/temperature-plot` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds; include domain-appropriate safety stop conditions where risk handling is relevant.
- `electronics/test-gfci-outlet`
  - [ ] Observed issue: `electronics/test-gfci-outlet` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds; include domain-appropriate safety stop conditions where risk handling is relevant.
- `electronics/thermistor-reading`
  - [ ] Observed issue: `electronics/thermistor-reading` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `electronics/thermometer-calibration`
  - [ ] Observed issue: `electronics/thermometer-calibration` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `electronics/voltage-divider`
  - [ ] Observed issue: `electronics/voltage-divider` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds; include domain-appropriate safety stop conditions where risk handling is relevant.

### energy (11 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): sysadmin/resource-monitoring, composting/check-temperature (fallback: no checked energy quests yet)

- `energy/battery-maintenance`
  - [ ] Observed issue: `energy/battery-maintenance` asks for logging/monitoring but pass criteria and anomaly response are not explicit.
  - [ ] Define required log fields/cadence/thresholds and gate completion on the produced log or monitoring snapshot artifact.
  - [ ] Add an anomaly classification branch with corrective action and a follow-up verification window before closure; include domain-appropriate safety stop conditions where risk handling is relevant.
- `energy/battery-upgrade`
  - [ ] Observed issue: `energy/battery-upgrade` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `energy/biogas-digester`
  - [ ] Observed issue: `energy/biogas-digester` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `energy/charge-controller-setup`
  - [ ] Observed issue: `energy/charge-controller-setup` reads like a one-pass install task, with verify/rollback state changes not clearly represented.
  - [ ] Apply install → verify → rollback sequencing in separate nodes and gate completion on a concrete verification artifact (status output, log snapshot, or expected-state item).
  - [ ] Add rollback/lockout-avoidance handling with a re-verify checkpoint before retrying the install path; include domain-appropriate safety stop conditions where risk handling is relevant.
- `energy/hand-crank-generator`
  - [ ] Observed issue: `energy/hand-crank-generator` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `energy/offgrid-charger`
  - [ ] Observed issue: `energy/offgrid-charger` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `energy/portable-solar-panel`
  - [ ] Observed issue: `energy/portable-solar-panel` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `energy/power-inverter`
  - [ ] Observed issue: `energy/power-inverter` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `energy/solar`
  - [ ] Observed issue: `energy/solar` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `energy/solar-tracker`
  - [ ] Observed issue: `energy/solar-tracker` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `energy/wind-turbine`
  - [ ] Observed issue: `energy/wind-turbine` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.

### firstaid (13 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): welcome/howtodoquests, composting/start (fallback: no checked firstaid quests yet)

- `firstaid/assemble-kit`
  - [ ] Observed issue: `firstaid/assemble-kit` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `firstaid/change-bandage`
  - [ ] Observed issue: `firstaid/change-bandage` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `firstaid/dispose-bandages`
  - [ ] Observed issue: `firstaid/dispose-bandages` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `firstaid/dispose-expired`
  - [ ] Observed issue: `firstaid/dispose-expired` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `firstaid/flashlight-battery`
  - [ ] Observed issue: `firstaid/flashlight-battery` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `firstaid/learn-cpr`
  - [ ] Observed issue: `firstaid/learn-cpr` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `firstaid/remove-splinter`
  - [ ] Observed issue: `firstaid/remove-splinter` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `firstaid/restock-kit`
  - [ ] Observed issue: `firstaid/restock-kit` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `firstaid/sanitize-pocket-mask`
  - [ ] Observed issue: `firstaid/sanitize-pocket-mask` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `firstaid/splint-limb`
  - [ ] Observed issue: `firstaid/splint-limb` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `firstaid/stop-nosebleed`
  - [ ] Observed issue: `firstaid/stop-nosebleed` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `firstaid/treat-burn`
  - [ ] Observed issue: `firstaid/treat-burn` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `firstaid/wound-care`
  - [ ] Observed issue: `firstaid/wound-care` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.

### geothermal (15 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): hydroponics/nutrient-check, composting/check-temperature (fallback: no checked geothermal quests yet)

- `geothermal/backflush-loop-filter`
  - [ ] Observed issue: `geothermal/backflush-loop-filter` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `geothermal/calibrate-ground-sensor`
  - [x] Observed issue (addressed): `geothermal/calibrate-ground-sensor` previously implied calibration work, but baseline/adjust/retest tolerance handling was under-specified; this was hardened in PR #3628. (PR #3628)
  - [x] Structure progression as baseline → adjust → re-test with a tolerance target and artifacts captured at baseline and post-adjust states. (PR #3628)
  - [x] Add a drift/variance follow-up branch that rolls back to last-known-good settings when readings do not hold. (PR #3628)
- `geothermal/check-loop-inlet-temp`
  - [ ] Observed issue: `geothermal/check-loop-inlet-temp` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds.
- `geothermal/check-loop-outlet-temp`
  - [ ] Observed issue: `geothermal/check-loop-outlet-temp` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds.
- `geothermal/check-loop-pressure`
  - [ ] Observed issue: `geothermal/check-loop-pressure` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds.
- `geothermal/check-loop-temp-delta`
  - [ ] Observed issue: `geothermal/check-loop-temp-delta` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds.
- `geothermal/compare-depth-ground-temps`
  - [ ] Observed issue: `geothermal/compare-depth-ground-temps` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds.
- `geothermal/compare-seasonal-ground-temps`
  - [ ] Observed issue: `geothermal/compare-seasonal-ground-temps` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds.
- `geothermal/install-backup-thermistor`
  - [x] Observed issue (addressed): `geothermal/install-backup-thermistor` previously read like a one-pass install task, with verify/rollback state changes not clearly represented; this was hardened in PR #3628. (PR #3628)
  - [x] Apply install → verify → rollback sequencing in separate nodes and gate completion on a concrete verification artifact (status output, log snapshot, or expected-state item). (PR #3628)
  - [x] Add rollback/lockout-avoidance handling with a re-verify checkpoint before retrying the install path. (PR #3628)
- `geothermal/log-ground-temperature`
  - [ ] Observed issue: `geothermal/log-ground-temperature` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds.
- `geothermal/log-heat-pump-warmup`
  - [ ] Observed issue: `geothermal/log-heat-pump-warmup` asks for logging/monitoring but pass criteria and anomaly response are not explicit.
  - [ ] Define required log fields/cadence/thresholds and gate completion on the produced log or monitoring snapshot artifact.
  - [ ] Add an anomaly classification branch with corrective action and a follow-up verification window before closure.
- `geothermal/monitor-heat-pump-energy`
  - [x] Observed issue (addressed): `geothermal/monitor-heat-pump-energy` previously asked for logging/monitoring but pass criteria and anomaly response were not explicit; this was hardened in PR #3628. (PR #3628)
  - [x] Define required log fields/cadence/thresholds and gate completion on the produced log or monitoring snapshot artifact. (PR #3628)
  - [x] Add an anomaly classification branch with corrective action and a follow-up verification window before closure. (PR #3628)
- `geothermal/purge-loop-air`
  - [x] Observed issue (addressed): `geothermal/purge-loop-air` previously described a cleaning cycle without a measurable before/after success definition; this was hardened in PR #3628. (PR #3628)
  - [x] Gate completion on paired pre/post artifacts that prove the state change (flow, residue, clarity, or equivalent). (PR #3628)
  - [x] Add a contamination/failure branch with a safe re-entry checkpoint and repeat-until-pass loop. (PR #3628)
- `geothermal/replace-faulty-thermistor`
  - [ ] Observed issue: `geothermal/replace-faulty-thermistor` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `geothermal/survey-ground-temperature`
  - [ ] Observed issue: `geothermal/survey-ground-temperature` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds.

### hydroponics (21 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): hydroponics/basil, hydroponics/nutrient-check

- `hydroponics/air-stone-soak`
  - [x] Observed issue: `hydroponics/air-stone-soak` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates. (PR #3638)
  - [x] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output). (PR #3638)
  - [x] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`. (PR #3638)
- `hydroponics/bucket_10`
  - [x] Observed issue: `hydroponics/bucket_10` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates. (PR #3640)
  - [x] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output). (PR #3640)
  - [x] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`. (PR #3640)
- `hydroponics/ec-calibrate`
  - [x] Observed issue: `hydroponics/ec-calibrate` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin. (PR #3640)
  - [x] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock. (PR #3640)
  - [x] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds. (PR #3640)
- `hydroponics/ec-check`
  - [x] Observed issue: `hydroponics/ec-check` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin. (PR #3611)
  - [x] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock. (PR #3611)
  - [x] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds. (PR #3611)
- `hydroponics/filter-clean`
  - [x] Observed issue: `hydroponics/filter-clean` describes a cleaning cycle without a measurable before/after success definition. (PR #3611)
  - [x] Gate completion on paired pre/post artifacts that prove the state change (flow, residue, clarity, or equivalent). (PR #3611)
  - [x] Add a contamination/failure branch with a safe re-entry checkpoint and repeat-until-pass loop. (PR #3611)
- `hydroponics/grow-light`
  - [x] Observed issue: `hydroponics/grow-light` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates. (PR #3640)
  - [x] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output). (PR #3640)
  - [x] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`. (PR #3640)
- `hydroponics/lettuce`
  - [x] Observed issue: `hydroponics/lettuce` is lifecycle-oriented but can read as narration unless staged setup and outcome proofs are separated. (PR #3611)
  - [x] Require staged evidence gates: one setup artifact first, then an outcome artifact before `finish`. (PR #3611)
  - [x] Add a stress/failure contingency branch with concrete pause/abort criteria and timed re-check before resuming. (PR #3611)
- `hydroponics/mint-cutting`
  - [ ] Observed issue: `hydroponics/mint-cutting` is lifecycle-oriented but can read as narration unless staged setup and outcome proofs are separated.
  - [ ] Require staged evidence gates: one setup artifact first, then an outcome artifact before `finish`.
  - [ ] Add a stress/failure contingency branch with concrete pause/abort criteria and timed re-check before resuming.
- `hydroponics/netcup-clean`
  - [x] Observed issue: `hydroponics/netcup-clean` describes a cleaning cycle without a measurable before/after success definition. (PR #3638)
  - [x] Gate completion on paired pre/post artifacts that prove the state change (flow, residue, clarity, or equivalent). (PR #3638)
  - [x] Add a contamination/failure branch with a safe re-entry checkpoint and repeat-until-pass loop. (PR #3638)
- `hydroponics/ph-check`
  - [x] Observed issue: `hydroponics/ph-check` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin. (PR #3626)
  - [x] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock. (PR #3626)
  - [x] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds. (PR #3626)
- `hydroponics/ph-test`
  - [x] Observed issue: `hydroponics/ph-test` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin. (PR #3638)
  - [x] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock. (PR #3638)
  - [x] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds. (PR #3638)
- `hydroponics/plug-soak`
  - [ ] Observed issue: `hydroponics/plug-soak` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `hydroponics/pump-install`
  - [x] Observed issue: `hydroponics/pump-install` reads like a one-pass install task, with verify/rollback state changes not clearly represented. (PR #3626)
  - [x] Apply install → verify → rollback sequencing in separate nodes and gate completion on a concrete verification artifact (status output, log snapshot, or expected-state item). (PR #3626)
  - [x] Add rollback/lockout-avoidance handling with a re-verify checkpoint before retrying the install path. (PR #3626)
- `hydroponics/pump-prime`
  - [x] Observed issue (addressed): `hydroponics/pump-prime` described a cleaning cycle without a measurable before/after success definition; this is now hardened with verification artifacts and recovery loops. (PR #3633)
  - [x] Gate completion on paired pre/post artifacts that prove the state change (flow, residue, clarity, or equivalent). (PR #3633)
  - [x] Add a contamination/failure branch with a safe re-entry checkpoint and repeat-until-pass loop. (PR #3633)
- `hydroponics/regrow-stevia`
  - [x] Observed issue: `hydroponics/regrow-stevia` is lifecycle-oriented but can read as narration unless staged setup and outcome proofs are separated. (PR #3638)
  - [x] Require staged evidence gates: one setup artifact first, then an outcome artifact before `finish`. (PR #3638)
  - [x] Add a stress/failure contingency branch with concrete pause/abort criteria and timed re-check before resuming. (PR #3638)
- `hydroponics/reservoir-refresh`
  - [ ] Observed issue: `hydroponics/reservoir-refresh` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `hydroponics/root-rinse`
  - [x] Observed issue: `hydroponics/root-rinse` describes a cleaning cycle without a measurable before/after success definition. (PR #3626)
  - [x] Gate completion on paired pre/post artifacts that prove the state change (flow, residue, clarity, or equivalent). (PR #3626)
  - [x] Add a contamination/failure branch with a safe re-entry checkpoint and repeat-until-pass loop. (PR #3626)
- `hydroponics/stevia`
  - [x] Observed issue (addressed): `hydroponics/stevia` was lifecycle-oriented but read as narration unless staged setup and outcome proofs were separated; staged evidence and recovery are now explicit. (PR #3633)
  - [x] Require staged evidence gates: one setup artifact first, then an outcome artifact before `finish`. (PR #3633)
  - [x] Add a stress/failure contingency branch with concrete pause/abort criteria and timed re-check before resuming. (PR #3633)
- `hydroponics/temp-check`
  - [x] Observed issue (addressed): `hydroponics/temp-check` centered on a measurement/check action with thin thresholds and recovery handling; the quest now enforces log interpretation and corrective retest loops. (PR #3633)
  - [x] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock. (PR #3633)
  - [x] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds. (PR #3633)
- `hydroponics/top-off`
  - [x] Observed issue: `hydroponics/top-off` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates. (PR #3611)
  - [x] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output). (PR #3611)
  - [x] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`. (PR #3611)
- `hydroponics/tub-scrub`
  - [x] Observed issue: `hydroponics/tub-scrub` describes a cleaning cycle without a measurable before/after success definition. (PR #3640)
  - [x] Gate completion on paired pre/post artifacts that prove the state change (flow, residue, clarity, or equivalent). (PR #3640)
  - [x] Add a contamination/failure branch with a safe re-entry checkpoint and repeat-until-pass loop. (PR #3640)

#### PR #3626 follow-up summary

1. **Selected quests (exact quest IDs)**
   - `hydroponics/ph-check`
   - `hydroponics/pump-install`
   - `hydroponics/root-rinse`

2. **Unchecked QA boxes targeted (copy exact checkbox label text from docs/qa/v3.md §4.5 + breadcrumb)**
   - `docs/qa/v3.md` §4.5 → `hydroponics` → `- [ ] ph-check`
   - `docs/qa/v3.md` §4.5 → `hydroponics` → `- [ ] pump-install`
   - `docs/qa/v3.md` §4.5 → `hydroponics` → `- [ ] root-rinse`

3. **Exemplar anchors used (verified checked anchors only; list only `<tree>/<quest>` tokens)**
   - `hydroponics/basil`
   - `hydroponics/nutrient-check`

4. **Before/after structural summary (branches + evidence gates + troubleshooting/safety)**
   - `hydroponics/ph-check`: expanded from thin measurement flow to prep → measure → interpret with out-of-range corrective loop and re-test gate.
   - `hydroponics/pump-install`: split install → verify → rollback/re-verify flow with installed-loop evidence gating to avoid dead-end retries.
   - `hydroponics/root-rinse`: enforces baseline and post-rinse evidence progression with contamination recovery loop and safety gating before finish.

5. **Tests and checks run (pass/fail)**
   - `npm run lint` (pass)
   - `npm run type-check` (fail: pre-existing `frontend/e2e/test-helpers.ts` typing errors)
   - `npm run build` (pass)
   - `npm run test:ci` (warning: did not complete within session window after entering `run-tests.js` root unit tests)
   - `npm run link-check` (pass)
   - `for f in frontend/src/pages/quests/json/hydroponics/*.json; do node scripts/validate-quest.js "$f" || exit 1; done` (pass)

6. **Asset follow-ups (or None)**
   - None.

7. **Follow-ups (or None)**
   - None.

8. **Checklist box updates (quote each modified checklist line verbatim with final checkbox state + appended PR tags)**
   - ``- [x] Observed issue: `hydroponics/ph-check` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin. (PR #3626)``
   - ``- [x] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock. (PR #3626)``
   - ``- [x] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds. (PR #3626)``
   - ``- [x] Observed issue: `hydroponics/pump-install` reads like a one-pass install task, with verify/rollback state changes not clearly represented. (PR #3626)``
   - ``- [x] Apply install → verify → rollback sequencing in separate nodes and gate completion on a concrete verification artifact (status output, log snapshot, or expected-state item). (PR #3626)``
   - ``- [x] Add rollback/lockout-avoidance handling with a re-verify checkpoint before retrying the install path. (PR #3626)``
   - ``- [x] Observed issue: `hydroponics/root-rinse` describes a cleaning cycle without a measurable before/after success definition. (PR #3626)``
   - ``- [x] Gate completion on paired pre/post artifacts that prove the state change (flow, residue, clarity, or equivalent). (PR #3626)``
   - ``- [x] Add a contamination/failure branch with a safe re-entry checkpoint and repeat-until-pass loop. (PR #3626)``

### programming (18 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): sysadmin/basic-commands, welcome/run-tests (fallback: no checked programming quests yet)

- `programming/avg-temp`
  - [x] Observed issue: `programming/avg-temp` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin. (PR #3650)
  - [x] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock. (PR #3650)
  - [x] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds. (PR #3650)
- `programming/graph-temp`
  - [ ] Observed issue: `programming/graph-temp` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds.
- `programming/graph-temp-data`
  - [ ] Observed issue: `programming/graph-temp-data` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds.
- `programming/hello-sensor`
  - [x] Observed issue: `programming/hello-sensor` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates. (PR #3650)
  - [x] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output). (PR #3650)
  - [x] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`. (PR #3650)
- `programming/http-post`
  - [ ] Observed issue: `programming/http-post` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `programming/json-api`
  - [ ] Observed issue: `programming/json-api` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `programming/json-endpoint`
  - [ ] Observed issue: `programming/json-endpoint` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `programming/median-temp`
  - [ ] Observed issue: `programming/median-temp` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds.
- `programming/moving-avg-temp`
  - [ ] Observed issue: `programming/moving-avg-temp` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds.
- `programming/plot-temp-cli`
  - [ ] Observed issue: `programming/plot-temp-cli` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds.
- `programming/stddev-temp`
  - [ ] Observed issue: `programming/stddev-temp` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds.
- `programming/temp-alert`
  - [ ] Observed issue: `programming/temp-alert` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds.
- `programming/temp-email`
  - [ ] Observed issue: `programming/temp-email` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds.
- `programming/temp-graph`
  - [ ] Observed issue: `programming/temp-graph` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds.
- `programming/temp-json-api`
  - [ ] Observed issue: `programming/temp-json-api` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds.
- `programming/temp-logger`
  - [ ] Observed issue: `programming/temp-logger` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds.
- `programming/thermistor-calibration`
  - [x] Observed issue: `programming/thermistor-calibration` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates. (PR #3650)
  - [x] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output). (PR #3650)
  - [x] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`. (PR #3650)
- `programming/web-server`
  - [ ] Observed issue: `programming/web-server` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.

### robotics (13 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): 3dprinting/start, welcome/run-tests (fallback: no checked robotics quests yet)

- `robotics/gyro-balance`
  - [ ] Observed issue: `robotics/gyro-balance` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `robotics/line-follower`
  - [ ] Observed issue: `robotics/line-follower` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `robotics/maze-navigation`
  - [ ] Observed issue: `robotics/maze-navigation` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `robotics/obstacle-avoidance`
  - [ ] Observed issue: `robotics/obstacle-avoidance` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `robotics/odometry-basics`
  - [ ] Observed issue: `robotics/odometry-basics` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `robotics/pan-tilt`
  - [ ] Observed issue: `robotics/pan-tilt` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `robotics/reflectance-sensors`
  - [ ] Observed issue: `robotics/reflectance-sensors` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds.
- `robotics/servo-arm`
  - [ ] Observed issue: `robotics/servo-arm` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `robotics/servo-control`
  - [ ] Observed issue: `robotics/servo-control` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `robotics/servo-gripper`
  - [ ] Observed issue: `robotics/servo-gripper` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `robotics/servo-radar`
  - [ ] Observed issue: `robotics/servo-radar` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `robotics/ultrasonic-rangefinder`
  - [ ] Observed issue: `robotics/ultrasonic-rangefinder` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `robotics/wheel-encoders`
  - [ ] Observed issue: `robotics/wheel-encoders` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.

### rocketry (10 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): composting/start, sysadmin/resource-monitoring (fallback: no checked rocketry quests yet)

- `rocketry/firstlaunch`
  - [ ] Observed issue: `rocketry/firstlaunch` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `rocketry/fuel-mixture`
  - [ ] Observed issue: `rocketry/fuel-mixture` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `rocketry/guided-rocket-build`
  - [x] Observed issue (addressed): `rocketry/guided-rocket-build` previously trended toward thin-shell progression with limited decision points and weak intermediate proof gates; this was hardened in this pass. (PR #3646)
  - [x] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output). (PR #3646)
  - [x] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant. (PR #3646)
- `rocketry/night-launch`
  - [ ] Observed issue: `rocketry/night-launch` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `rocketry/parachute`
  - [ ] Observed issue: `rocketry/parachute` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `rocketry/preflight-check`
  - [x] Observed issue (addressed): `rocketry/preflight-check` previously centered on a measurement/check action but acceptance thresholds and out-of-range handling were thin; this was hardened in this pass. (PR #3646)
  - [x] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock. (PR #3646)
  - [x] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds; include domain-appropriate safety stop conditions where risk handling is relevant. (PR #3646)
- `rocketry/recovery-run`
  - [ ] Observed issue: `rocketry/recovery-run` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds; include domain-appropriate safety stop conditions where risk handling is relevant.
- `rocketry/static-test`
  - [x] Observed issue (addressed): `rocketry/static-test` previously centered on a measurement/check action but acceptance thresholds and out-of-range handling were thin; this was hardened in this pass. (PR #3646)
  - [x] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock. (PR #3646)
  - [x] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds; include domain-appropriate safety stop conditions where risk handling is relevant. (PR #3646)
- `rocketry/suborbital-hop`
  - [ ] Observed issue: `rocketry/suborbital-hop` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`; include domain-appropriate safety stop conditions where risk handling is relevant.
- `rocketry/wind-check`
  - [ ] Observed issue: `rocketry/wind-check` centers on a measurement/check action but acceptance thresholds and out-of-range handling are thin.
  - [ ] Require a recorded measurement artifact plus an interpretation node before `finish` can unlock.
  - [ ] Add an out-of-range corrective branch with a mandatory re-test loop and explicit pass/fail bounds; include domain-appropriate safety stop conditions where risk handling is relevant.

### ubi (3 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): ubi/basicincome

- `ubi/first-payment`
  - [ ] Observed issue: `ubi/first-payment` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `ubi/reminder`
  - [ ] Observed issue: `ubi/reminder` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `ubi/savings-goal`
  - [ ] Observed issue: `ubi/savings-goal` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.

### woodworking (10 quests)

Exemplar anchors (checked in docs/qa/v3.md §4.5): 3dprinting/start, welcome/howtodoquests (fallback: no checked woodworking quests yet)

- `woodworking/apply-finish`
  - [ ] Observed issue: `woodworking/apply-finish` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `woodworking/birdhouse`
  - [ ] Observed issue: `woodworking/birdhouse` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `woodworking/bookshelf`
  - [ ] Observed issue: `woodworking/bookshelf` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `woodworking/coffee-table`
  - [ ] Observed issue: `woodworking/coffee-table` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `woodworking/finish-sanding`
  - [ ] Observed issue: `woodworking/finish-sanding` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `woodworking/picture-frame`
  - [ ] Observed issue: `woodworking/picture-frame` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `woodworking/planter-box`
  - [ ] Observed issue: `woodworking/planter-box` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `woodworking/step-stool`
  - [ ] Observed issue: `woodworking/step-stool` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `woodworking/tool-rack`
  - [ ] Observed issue: `woodworking/tool-rack` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.
- `woodworking/workbench`
  - [ ] Observed issue: `woodworking/workbench` still trends toward thin-shell progression with limited decision points and weak intermediate proof gates.
  - [ ] Add at least one non-linear branch (main path plus alternate strategy) and gate advancement on mechanics-backed evidence (`requiresItems`, `launchesProcess`, or logged output).
  - [ ] Insert troubleshooting/recovery handling so failures produce actionable next steps and a verification retry before `finish`.

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
