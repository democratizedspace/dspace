# Quest quality & reliability gaps: coverage expansion and targeted hardening

## Context

This design note documents a full quest-quality/reliability suite audit, then records the gap
classes and quest fixes implemented in this PR slice. Scope intentionally stayed narrow: rocketry
static-test reliability plus concrete guardrails/fixes on currently affected quest content.

## Reviewed quest quality/reliability suite surface

These suites were reviewed across both `frontend/__tests__` and root `tests/`, and are now kept in
sync in `docs/qa/v3.md` and `frontend/src/pages/docs/md/quest-guidelines.md`:

- `frontend/__tests__/questCanonical.test.js`
- `frontend/__tests__/questQuality.test.js`
- `frontend/__tests__/questSimulation.test.js`
- `frontend/__tests__/questDependencies.test.js`
- `tests/questDialogueValidation.test.ts`
- `tests/questSchemaValidation.test.ts`
- `tests/builtinQuestSchema.test.ts`
- `tests/questRewardsValidation.test.ts`
- `tests/questCompletableItems.test.ts`
- `tests/questProcessCoverage.test.ts`
- `tests/questProcessNecessitySimulation.test.ts`
- `tests/questReliabilityCoverage.test.ts`
- `tests/questProcessRecoveryPaths.test.ts`
- `tests/questRewardGrantSeparation.test.ts`
- `tests/questDependencyReferences.test.ts`
- `tests/questGraphValidation.test.ts`
- `tests/questGraph.test.ts`
- `tests/questPrerequisites.test.ts`
- `tests/progressionBalance.test.ts`
- `tests/sysadminQuestQuality.test.ts`

## Gap classes addressed in this PR

### 1) Test-focused quests without process-backed execution

- **What was wrong:** test-oriented quest IDs could still be purely narrative.
- **Fix:** `tests/questReliabilityCoverage.test.ts` now enforces process-backed execution for
  `*-test`/`*/tests` quest IDs.
- **Why process-backed is correct for `rocketry/static-test`:** static-burn validation is an
  execution task; forcing a process option ensures the quest reflects measurable operation rather
  than click-through narration.

### 2) Process nodes without deterministic recovery/review paths

- **What was wrong:** some nodes with process options allowed no explicit non-process branch, making
  recovery flow brittle and less teachable.
- **Fix:** added `tests/questProcessRecoveryPaths.test.ts` to require at least one explicit `goto`
  option in nodes that offer process actions.
- **Affected quest updates:**
  - `frontend/src/pages/quests/json/ubi/basicincome.json` (`process` node gained review loop)
  - `frontend/src/pages/quests/json/hydroponics/basil.json` (`regrow` gained review branch)
  - `frontend/src/pages/quests/json/energy/solar-1kWh.json` (`charge` gained re-check branch)
  - `frontend/src/pages/quests/json/electronics/arduino-blink.json` (`finish` gained evidence-review branch)
  - `frontend/src/pages/quests/json/aquaria/position-tank.json` (`verify` split process logging and explicit review `goto`)
  - `frontend/src/pages/quests/json/aquaria/net-fish.json` (`baseline`/`recovery`/`release` split process logging and explicit review branches)

### 3) Duplicate item awards via both `grantsItems` and top-level `rewards`

- **What was wrong:** some quests double-awarded the same item once in-dialogue and again at quest
  completion.
- **Fix:** added `tests/questRewardGrantSeparation.test.ts` to block overlapping IDs across
  `grantsItems` and top-level `rewards`.
- **Affected quest updates:**
  - `frontend/src/pages/quests/json/welcome/howtodoquests.json`
  - `frontend/src/pages/quests/json/hydroponics/lettuce.json`
  - `frontend/src/pages/quests/json/energy/solar.json`
  - `frontend/src/pages/quests/json/energy/offgrid-charger.json`

## Rocketry static-test reliability recap

- `frontend/src/pages/quests/json/rocketry/static-test.json` keeps process-backed `burn` execution
  and explicit proof-gated progression.
- `frontend/src/pages/processes/base.json` keeps `run-static-engine-test` as the authoritative
  simulation step powering that progression.
- `frontend/src/pages/docs/md/rocketry.md` reflects the live process IO and gating semantics.

## Why these guardrails improve quality

- Process recovery-path enforcement makes process-heavy quests teach resilient operational behavior
  (review, retry, recover) instead of linear “run then finish”.
- Reward/grant separation keeps quest economy predictable by eliminating accidental double payouts.
- Combined with reliability coverage for test-named quests, these checks improve both educational
  flow and deterministic progression.

## Follow-up reliability classes (not implemented here)

Potential future additions discovered during audit:

- Guardrail for process options that redundantly gate on process output in the same option.
- Guardrail for excessive process-output count thresholds that can deadlock first-time completion.
