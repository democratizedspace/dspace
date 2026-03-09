# Quest quality & reliability gaps: coverage expansion and quest fixes

## Context

This design note audits the quest-quality test surface and aligns contributor-facing docs with the
actual automated checks. It also captures a reliability gap class that was not explicitly tested,
then records the quest updates made to close that gap.

## Existing quest quality tests now documented in both QA docs and in-game docs

The following quality/reliability suites are now explicitly referenced in:

- Repo QA checklist: `docs/qa/v3.md`
- In-game contributor docs: `frontend/src/pages/docs/md/quest-guidelines.md`

Coverage set:

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
- `tests/questDependencyReferences.test.ts`
- `tests/questGraphValidation.test.ts`
- `tests/questGraph.test.ts`
- `tests/questReliabilityCoverage.test.ts`
- `tests/sysadminQuestQuality.test.ts`

## Missing problem class identified

### Class: “test-named quest without process-backed execution”

#### Why this is a reliability problem

Quests whose IDs are explicitly test-focused (`*-test`, `*/tests`) should model actual execution
through a process option. Without this, a player can click through measurement/check narration
without invoking the underlying simulated operation, weakening reproducibility and making the quest
feel detached from gameplay mechanics.

#### Prior detection gap

We had build/install process coverage checks and domain-specific quality checks, but no generalized
reliability gate for test-named quests.

## New automated gate

- Added `tests/questReliabilityCoverage.test.ts`.
- Rule: every quest with a test-focused ID pattern must include at least one process-backed option.

## Quests affected and remediation details

### 1) `rocketry/static-test`

**What was wrong**

- The core static burn step (`burn`) used a `goto` transition instead of a process-backed action.
- The quest was narratively strong but mechanically skipped the execution simulation.

**What changed**

- Updated `burn` option to `type: "process"` with `process: "run-static-engine-test"`.
- Added new process definition `run-static-engine-test` in the process registry.
- Updated the rocketry skill doc so “Processes used” for this quest now reflects the new process and
  IO contract.

## Design outcomes

- Quality docs now enumerate the full quest quality/reliability automated test matrix.
- Test-focused quest execution now has an explicit reliability gate.
- `rocketry/static-test` now conforms to process-backed test execution semantics.
