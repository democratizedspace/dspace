# Quest quality gap analysis for v3 (manual QA vs. unchecked backlog)

## Why this doc exists

The v3 QA checklist is already being used as a manual validation ledger, but the distribution of checked vs.
unchecked quests suggests we still have a quality mismatch between:

1. quests that have been manually exercised end-to-end, and
2. newly added quests that currently pass schema/tests but still feel shallow in-game.

This document focuses on the checked quests in `docs/qa/v3.md#45-quest-by-quest-qa-checklist`, compares
patterns against unchecked quests (especially those listed in `docs/new-quests.md`), and proposes
documentation changes so both humans and LLMs produce better quests by default.

---

## Data snapshot used for this analysis

- Manual QA checked quests in section 4.5: **16/247**.
- Unchecked quests in section 4.5: **231/247**.
- Quests listed as newly added in v3/v2.x doc: **246** entries in `docs/new-quests.md`, with **180** at
  `hardening.passes = 0`.

### Checked quests (manual QA completed)

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

### Observed contrast (checked vs unchecked)

Checked quests tend to include one or more of:

- explicit route/tool guidance (for example, open `/inventory`, run `npm run test:pr`),
- branching dialogue with retries or quiz loops,
- concrete gating items tied to a believable step sequence,
- multi-step process progression.

Unchecked v3-heavy areas often show the opposite:

- highly linear 3-node structures (`start -> middle -> finish`),
- little or no branching,
- weak or generic “I did it” confirmation text,
- process intent stated in prose but not represented as `type: "process"` options.

---

## Antipatterns found in unchecked/new quests

### 1) Template-linear quest shape used as final content

Many quests are structurally identical: one intro node, one instruction node, one finish node, no meaningful
branching or learner feedback loop. Example: `devops/fail2ban`, `robotics/line-follower`,
`programming/http-post`, `firstaid/treat-burn`.

**Why this hurts quality**

- The player can often click straight through with minimal understanding.
- It teaches “labels” instead of practice or verification.

### 2) “Process-like” actions modeled as `goto` instead of `process`

There are multiple options containing a `process` field while `type` is `goto`, which makes process semantics
ambiguous and likely bypasses intended gameplay. Example quests include:

- `geothermal/check-loop-pressure`
- `electronics/measure-arduino-5v`
- `devops/enable-https`
- `firstaid/flashlight-battery`
- `chemistry/stevia-tasting`

**Why this hurts quality**

- The narrative claims a real action occurred, but the quest option type may not enforce process execution.
- QA can misread completion as mechanic validation when it is only dialogue navigation.

### 3) Generic completion copy detached from DSPACE mechanics

Several quests end with generic celebratory lines without checking route-level behavior, process outcomes,
error paths, or safety edge cases.

**Why this hurts quality**

- Encourages superficial “content complete” status even when the game loop was not stress-tested.

### 4) Hardening metadata lags content scale

A large share of newly added quests still show `hardening.passes: 0`, which is expected during rapid expansion,
but it means these quests are disproportionately likely to retain first-draft issues.

**Why this hurts quality**

- There is no reliable signal that narrative/gameplay polish happened after generation.

---

## Problematic quest shortlist and required improvements

> These are not “delete” recommendations. They are targeted hardening candidates.

### `devops/fail2ban`

- [ ] Add at least one decision branch (e.g., tune ban window vs. lockout risk).
- [ ] Add an explicit process step and gate completion on resulting item/process evidence.
- [ ] Add one failure/recovery branch (misconfiguration rollback).

### `robotics/line-follower`

- [ ] Replace single “hardware assembled” gate with staged validation (sensors first, then control loop).
- [ ] Add branch for common failure modes (oscillation, drift, sensor inversion).
- [ ] Require a concrete output artifact/item before finish.

### `programming/http-post`

- [ ] Require at least one route-level verification step (`/submit` handling + payload validation).
- [ ] Add a branch for malformed JSON/error handling.
- [ ] Tie final completion to a process or item proving the endpoint works.

### `firstaid/treat-burn`

- [ ] Expand safety specificity (severity threshold, when to escalate beyond home care).
- [ ] Add “unsafe choice” branch and correction path.
- [ ] Gate finish on procedural checks, not only possession of one item.

### `geothermal/check-loop-pressure`

- [ ] Convert process-intent option to `type: "process"` rather than `goto` with a `process` field.
- [ ] Add threshold interpretation branch (normal vs concerning reading).
- [ ] Add follow-up action branch when readings drift.

---

## Documentation improvements implemented in this PR

### A) AGENTS-level guardrail update

`AGENTS.md` now points quest authors to this analysis and requires an anti-pattern self-check before submitting
quest edits.

### B) Downstream prompt update for LLM/human authors

`docs/prompts/codex/quests.md` now includes a strict “anti-pattern rejection checklist” requiring:

- one concrete route/process verification step,
- one failure/recovery path,
- prohibition on `type: "goto"` options carrying a `process` field,
- explicit comparison against at least one manually validated quest in QA section 4.5.

---

## Suggested rollout checklist (for maintainers)

- [ ] Triage unchecked quests by risk (mechanic mismatch > copy polish > reward tuning).
- [ ] Prioritize quests with `process` on non-`process` option types.
- [ ] Raise floor requirements in quest prompts to reject linear 3-node drafts by default.
- [ ] Require at least one “player can fail and recover” branch for non-intro quests.
- [ ] Add an automated lint/check that flags options containing `process` when `type !== "process"`.
- [ ] Continue manual QA checkoffs in `docs/qa/v3.md` and link each completed hardening pass to concrete fixes.
