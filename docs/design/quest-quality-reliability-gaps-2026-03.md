# Quest quality and reliability gaps: test coverage parity and remediation

## Context

This design note documents a gap review of DSPACE quest quality tests and the resulting
hardening work across docs, tests, and quest content.

Goals:

1. Ensure development docs reference the full quest quality/reliability test surface.
2. Add missing reliability tests for classes of issues not previously enforced.
3. Fix existing quests that fail the new reliability expectations.

## Existing quest quality tests reviewed

The review covered quest-oriented suites in both `frontend/__tests__` and root `tests/`:

- `questQuality.test.js`
- `questCanonical.test.js`
- `questSimulation.test.js`
- `questDependencies.test.js`
- `tests/questDependencyReferences.test.ts`
- `tests/questDialogueValidation.test.ts`
- `tests/questProcessCoverage.test.ts`
- `tests/questProcessNecessitySimulation.test.ts`
- `tests/questRewardsValidation.test.ts`
- `tests/questSchemaValidation.test.ts`
- `tests/questPrerequisites.test.ts`
- `tests/questCompletableItems.test.ts`
- `tests/progressionBalance.test.ts`
- `tests/sysadminQuestQuality.test.ts`

## Missing problem classes identified

### 1) Process nodes without deterministic recovery paths

**Problem class:** nodes that offer `process` plus immediate `finish`, but no explicit non-process
fallback (`goto`/retry branch). This can encourage players to finish without re-verifying steps
or recovering from a failed process.

**New guardrail:** `tests/questProcessRecoveryPaths.test.ts`

- Flags any dialogue node that has one or more `process` options but lacks a non-process,
  non-`finish` option.
- Forces explicit retry/recovery routing in process-heavy steps.

### 2) Duplicate item awarding via both `grantsItems` and top-level `rewards`

**Problem class:** the same item ID granted inside dialogue and also granted again in quest-level
`rewards`, causing reward inflation and confusing progression economics.

**New guardrail:** `tests/questRewardGrantSeparation.test.ts`

- Flags quests where a top-level reward item ID is also granted in any dialogue option.
- Keeps immediate branch grants distinct from completion rewards.

## Quests affected and changes

### A) Process recovery-path fixes

1. `ubi/basicincome`
   - **Issue:** process node had `process` + `finish` only.
   - **Fix:** added a `goto` recovery path back to the earning explanation branch.

2. `hydroponics/basil`
   - **Issue:** regrow node had only process launches + finish.
   - **Fix:** added a `goto` fallback to revisit lighting/nutrient checks before rerunning.

3. `energy/solar-1kWh`
   - **Issue:** charge node had only process launch + finish.
   - **Fix:** added a `goto` path to return to upgrade/panel planning context.

4. `electronics/arduino-blink`
   - **Issue:** finish node included process launch + finish without a non-process retry route.
   - **Fix:** added a `goto` back to verification checks.

5. `aquaria/position-tank`
   - **Issue:** verify node had looping process log + finish only.
   - **Fix:** added a `goto` path back to heater stabilization checks.

6. `aquaria/net-fish`
   - **Issue:** release node had process log + finish only.
   - **Fix:** added a `goto` path back to fish recovery checks.

### B) Reward/grant separation fixes

1. `welcome/howtodoquests`
   - **Issue:** `dUSD` was granted inside dialogue and also in quest completion rewards.
   - **Fix:** removed duplicate quest-level `dUSD` reward while retaining other completion reward.

2. `hydroponics/lettuce`
   - **Issue:** seed item was granted in dialogue and also duplicated in top-level rewards.
   - **Fix:** changed completion reward to harvested lettuce output item.

3. `energy/solar`
   - **Issue:** panel item duplicated between dialogue grant and completion rewards.
   - **Fix:** removed duplicate panel from top-level rewards; retained unique reward item.

4. `energy/offgrid-charger`
   - **Issue:** panel item duplicated between dialogue grant and completion rewards.
   - **Fix:** replaced completion reward with a non-duplicated energy item.

## Documentation updates included

- `frontend/TESTING.md` now enumerates the full quest quality/reliability suites and run commands.
- `frontend/src/pages/docs/md/testing-guide.md` now includes a dedicated quest quality/reliability
  section listing all relevant suites.

## Expected outcomes

- Better deterministic quest flow under process failures/retries.
- Cleaner reward economics and fewer accidental duplicate item grants.
- Stronger discoverability of quest quality checks for contributors and reviewers.
