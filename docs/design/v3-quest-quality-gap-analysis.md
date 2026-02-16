# v3 Quest Quality Gap Analysis (Manual QA vs Unchecked Backlog)

## Why this exists

The QA checklist now tracks quest-by-quest validation in one place:
`docs/qa/v3.md#45-quest-by-quest-qa-checklist`.
That checklist currently has a small set of checked quests and a much larger unchecked backlog,
while `docs/new-quests.md` shows most of the game content was added in v3.

This document compares those two groups, identifies common anti-patterns in unchecked quests
(especially v3 additions), and proposes concrete documentation changes so future human and LLM
authors ship quests with better gameplay and realism on first pass.

## Scope and method

- Source list of manually validated quests: checked boxes in `docs/qa/v3.md` section 4.5.
- Source list of v3 additions: `docs/new-quests.md` under "Quests added in v3".
- Content review input:
  - close-read of checked exemplars (`composting/*`, `sysadmin/*`, `welcome/*`)
  - close-read of representative unchecked v3 quests across domains
  - structural metrics (dialogue depth, branching, item/process gating density)

## Current QA coverage snapshot

- Total quests in the checklist: **247**
- Manually validated (`[x]`) quests: **16**
- Unchecked quests: **231**
- New quests in v3: **225**
- v3 quests already manually validated: **12**
- v3 quests still unchecked: **213**

### Trees with strongest/weakest manual coverage

- Strongest: `composting` (4/4 checked), `sysadmin` (3/3 checked), `welcome` (5/5 checked)
- Weakest among high-volume v3 trees: `astronomy`, `programming`, `electronics`, `devops`,
  `woodworking` (all currently 0 checked despite large v3 additions)

## What checked quests do better

Checked quests are generally stronger in four areas:

1. **Longer learning arc**
   - More dialogue nodes and more meaningful decision points.
   - Example: `composting/start` uses a teaching arc + quiz + retries, not just a linear click-path.
2. **Mechanics literacy**
   - Explicitly teaches how DSPACE works (where to run processes, how gating works,
     what artifact proves completion).
3. **Concrete, testable outcomes**
   - Gates use specific items/processes and validate actions, rather than vague acknowledgements.
4. **Failure/retry loops**
   - Wrong answers or incomplete prep route back into guided correction instead of silent pass-through.

## Anti-patterns seen in unchecked (especially v3) quests

These patterns repeat across many unchecked quests:

1. **Three-node linear scripts**
   - Pattern: `start -> do thing -> finish` with little branching.
   - Result: little learning value, low replayability, and weak signal for QA.

2. **Mechanically shallow process usage**
   - Process button exists, but quest text does not explain inputs, outputs, or why the step matters.

3. **Generic completion gates**
   - "Done"/"Looks good" options without strong evidence checkpoints.

4. **Narrative abstraction over in-game affordances**
   - Dialogue references realistic actions, but does not map clearly to item pages,
     process cards, or inventory outcomes.

5. **Hardening score inflation**
   - Some short, minimally branched quests have very high hardening scores,
     which dilutes hardening as a quality signal.

6. **Safety/accuracy gaps in technical domains**
   - Especially in chemistry, electrical, and first-aid content where procedural nuance matters.

## Problematic quest watchlist and remediation checklist

The quests below are representative of recurring issues and should be prioritized for rewrites.

### astronomy (high volume, low depth)

- [ ] `astronomy/north-star`
  - [ ] Add one misconception branch (e.g., wrong star identification) with corrective feedback.
  - [ ] Add an evidence checkpoint requiring a logged observation artifact before finish.
- [ ] `astronomy/planetary-alignment`
  - [ ] Expand beyond a 3-node flow with prep, observation quality, and interpretation stages.
  - [ ] Add explicit in-game process/item mapping for each stage.

### chemistry (safety-critical domain)

- [ ] `chemistry/ph-test`
  - [ ] Split PPE, sampling, and disposal into separate validated steps.
  - [ ] Require explicit "what to do when out-of-range" remediation path before completion.
- [ ] `chemistry/precipitation-reaction`
  - [ ] Add safety branch for incompatible reagent handling.
  - [ ] Add inventory/process proof of controlled setup, not just completion acknowledgement.

### devops / programming (tooling realism)

- [ ] `devops/monitoring`
  - [ ] Add metric selection and alert-threshold validation branch.
  - [ ] Require an artifact that proves dashboard+alert configuration, not only stack install.
- [ ] `programming/json-api`
  - [ ] Ensure branches validate schema stability and error handling, not just endpoint presence.
  - [ ] Tie finish gate to a generated test/report item proving contract behavior.

### firstaid (procedural safety)

- [ ] `firstaid/change-bandage`
  - [ ] Add red-flag escalation branch (symptoms that require professional care).
  - [ ] Add contamination-prevention checks (clean field, disposal) before completion.
- [ ] `firstaid/treat-burn`
  - [ ] Add severity triage branch (minor vs urgent cases) with explicit do-not steps.
  - [ ] Validate timing/procedure with process-output evidence before finish.

### cross-cutting quest quality candidates

- [ ] `aquaria/top-off`
  - [ ] Add water-quality rationale branch (evaporation vs water-change distinction).
- [ ] `electronics/measure-led-current`
  - [ ] Add meter-range/safety branch and require measured-value artifact.
- [ ] `robotics/line-follower`
  - [ ] Add tuning loop branch (sensor threshold calibration) with iterative checkpoints.
- [ ] `woodworking/coffee-table`
  - [ ] Add staged craftsmanship QA (dimension check, joinery check, finish cure window).

## Documentation changes implemented in this PR

To address these anti-patterns at authoring time, this PR also updates:

- `docs/prompts/codex/quests.md` with explicit anti-pattern guardrails,
  a minimum structure bar, stronger acceptance criteria, and hardening-evidence requirements.
- `frontend/src/pages/docs/md/quest-submission.md` with a pre-submission quality rubric for
  both human and LLM authors, including a "definition of done" checklist.

## Suggested next operational steps

- [ ] Add a focused `questDepth` or `questNarrativeQuality` automated test to flag overly linear
      quests (e.g., <=3 nodes with no remediation branches) in safety/technical trees.
- [ ] Add a QA triage board that starts with the watchlist above and expands by tree.
- [ ] Require docs/quest rubric sign-off when updating `hardening.score` above 90.
- [ ] Track "checked quests per tree" as a release KPI so coverage stays balanced.
