# DSPACE v3 Quest Quality Review: Validated vs Unvalidated Content

## Why this document exists

During v3 QA, manual validation has only covered a subset of quests in
`docs/qa/v3.md` section 4.5. This review compares:

1. quests already manually validated (checked boxes), and
2. quests not yet manually validated (unchecked), with extra focus on v3 additions listed in
   `docs/new-quests.md`.

The goal is to identify repeatable content anti-patterns (especially LLM-shaped ones), call out
specific problematic quests, and propose concrete documentation changes so future quest authors
(LLMs and humans) produce higher-quality content on the first pass.

## Source set and method

- QA status source: `docs/qa/v3.md` section **4.5 Quest-by-quest QA checklist**.
- New-v3 source: `docs/new-quests.md` section **Quests added in v3**.
- Quest content source: `frontend/src/pages/quests/json/*/*.json`.

I used a lightweight structural/content scan to compare cohorts:

- manually validated quests (checked in 4.5 and resolvable to real quest IDs),
- unchecked quests,
- unchecked quests that are also listed in new-v3.

### Data note: checklist/id drift

The checklist marks `3dprinting/start` as validated, but the actual quest ID is
`3dprinter/start` (file path `3dprinting/start.json`). This is a naming drift issue between the
checklist slug and quest `id`.

## High-level findings

### Coverage gap

- Manual validation currently covers 16 checklist boxes at quest level, but only 15 map directly to
  concrete quest IDs because of the `3dprinting/start` vs `3dprinter/start` mismatch.
- 231 quest checklist entries remain unchecked.

### Structural difference (validated vs unchecked new-v3)

Compared to manually validated quests, unchecked v3 quests are much more compressed:

- Avg dialogue nodes:
  - validated: **9.07**
  - unchecked new-v3: **3.76**
- Avg options:
  - validated: **16.4**
  - unchecked new-v3: **5.27**
- Avg dialogue text word count:
  - validated: **215.4**
  - unchecked new-v3: **76.22**

Interpretation: many unchecked new-v3 quests read like thin wrappers around a single process gate,
not a complete learning interaction.

### LLM-shaped phrase repetition

Across unchecked new-v3 quests, templated praise/filler repeats heavily:

- `ready` appears in quest text **54** times
- `nice work` appears **44** times
- `great job` appears **9** times

Repetition by itself is not fatal, but this pattern often co-occurs with shallow educational
content and low branch depth.

## Anti-pattern catalog (with examples)

### 1) Three-node skeleton quests with minimal instructional depth

Symptoms:

- start → middle action → finish
- little to no troubleshooting, safety context, or conceptual explanation
- completion gates often feel arbitrary (`requiresItems` checks without teaching loop)

Examples:

- `programming/stddev-temp`
- `geothermal/check-loop-pressure`
- `devops/fail2ban`

Why this matters: these quests pass schema checks but underdeliver on DSPACE's educational mission
and make progression feel transactional.

### 2) Process-name mismatch or weak process specificity

Symptoms:

- quest copy implies one domain but process reference points to a cross-domain generic action
- process call is present, but instructions do not prepare users for input/output expectations

Example:

- `hydroponics/temp-check` uses process `check-aquarium-temperature` and jumps quickly to completion
  without domain-specific troubleshooting context.

Why this matters: users cannot reliably connect quest intent to process mechanics, making failures
feel random.

### 3) Generic congratulation endings that do not reinforce learning outcomes

Symptoms:

- finish node defaults to short praise with no recap
- no explicit what/why reflection or next-step bridge

Examples:

- `aquaria/balance-ph`
- `geothermal/check-loop-pressure`
- `astronomy/planetary-alignment`

Why this matters: good quests should close the loop by naming what was learned and what unlocks
next.

### 4) Weak branching and low consequence signaling

Symptoms:

- options are mostly linear confirmations
- limited meaningful alternative paths (e.g., quiz, recovery, safety detour)
- option text does not communicate consequences

Example cohort:

- many quests in `programming/*`, `devops/*`, and `geothermal/*` added in v3 use near-identical
  linear flow patterns.

Why this matters: low agency reduces replayability and makes quests feel authored by template.

### 5) Hardening metadata gives false confidence

Symptoms:

- `hardening.score` present (sometimes high) even when quest is content-thin
- metadata appears to represent formatting/compliance refinement, not pedagogical quality

Examples:

- `astronomy/planetary-alignment` has high hardening score but still has minimal instructional
  depth.

Why this matters: contributors may optimize for score rather than player learning quality.

## What validated quests are doing better

Validated quests (for example, `composting/start`, `hydroponics/nutrient-check`, `welcome/run-tests`)
more often include:

- explicit UX guidance on where to run processes and how DSPACE mechanics work,
- richer node structure with retry/remediation branches,
- concrete safety and troubleshooting details,
- clearer cause/effect in option text,
- endings that summarize learning and bridge to the next quest.

This is the quality bar that should be documented and enforced upstream.

## Problematic quests and improvement checklists

Use this section as an execution list for follow-up quest hardening.

### `programming/stddev-temp`

Issues:

- [ ] Too short (3 nodes) for a concept that needs explanation and verification.
- [ ] No sample dataset, edge-case warning, or formula interpretation.
- [ ] Finish text praises completion but does not connect to practical use.

Suggested fixes:

- [ ] Add at least one troubleshooting branch (empty file, malformed line, units mismatch).
- [ ] Add one interpretation branch ("high stddev means what operationally?").
- [ ] Gate completion on an artifact/log item representing computed output, not only a yes/no step.

### `geothermal/check-loop-pressure`

Issues:

- [ ] Minimal procedural detail for pressure safety and expected range handling.
- [ ] No remediation path when reading is unstable/out of range.
- [ ] Ending lacks operational next steps.

Suggested fixes:

- [ ] Add expected-range guidance and branch for high/low pressure diagnosis.
- [ ] Add explicit safety warning branch before gauge interaction.
- [ ] Add follow-up option that routes to a maintenance quest if pressure is abnormal.

### `hydroponics/temp-check`

Issues:

- [ ] Process id and quest context feel semantically mismatched (`check-aquarium-temperature`).
- [ ] Little explanation of why range matters beyond one sentence.
- [ ] No path for out-of-range reading.

Suggested fixes:

- [ ] Either rename/specialize process for hydroponics context or explain shared process clearly.
- [ ] Add branch for high temp mitigation (shade, circulation, top-off timing).
- [ ] Add branch for low temp mitigation and recovery timing.

### `devops/fail2ban`

Issues:

- [ ] Security concept compressed into one install step.
- [ ] No distinction between false-positive risk and brute-force protection.
- [ ] No verification branch (e.g., inspect bans/logs) before finish.

Suggested fixes:

- [ ] Add verification option requiring evidence item/log output.
- [ ] Add branch covering jail tuning and service restart pitfalls.
- [ ] Add explicit note connecting this quest to adjacent hardening quests.

### `aquaria/balance-ph`

Issues:

- [ ] "Adjust and verify" flow is too thin for chemistry-sensitive livestock context.
- [ ] No species-specific range caveat or change-rate warning.
- [ ] No branch for pH rebound/instability after correction.

Suggested fixes:

- [ ] Add branch for "pH overshot" with safe rollback guidance.
- [ ] Add branch for repeated drift and likely root causes.
- [ ] Add end recap with actionable monitoring cadence.

## Documentation improvements implemented in this PR

1. Added a new anti-pattern prevention section to
   `frontend/src/pages/docs/md/quest-guidelines.md` with:
   - explicit "LLM/human quality gate" checklist,
   - minimum interaction-depth expectations,
   - anti-pattern examples mapped to concrete quest IDs,
   - pre-PR self-review questions to prevent template-only quests.
2. Added this design review document under `docs/design/` so QA and content authors can align on
   a shared quality rubric before editing quest JSON.

## Recommended next process changes (not yet automated)

- Add a CI warning (not hard fail initially) for quests with very low text/node density.
- Extend hardening metadata workflow to include "pedagogical quality" rubric fields separate from
  schema/style hardening.
- Add a `scripts/quest-quality-report.mjs` that prints per-tree depth and repetition stats to help
  reviewers quickly spot likely template-generated content.
