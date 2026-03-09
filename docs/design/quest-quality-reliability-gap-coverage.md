# Quest quality and reliability gap coverage design

## Context

DSPACE already has several quest-focused tests, but development docs did not consistently list
all of them and one important safety/reliability class was not explicitly tested: livestock transfer
quests could pass while omitting toxicity checks and acclimation language.

This design captures the gaps, the new rule, and the quest updates made to satisfy it.

## Existing quest quality/reliability tests now documented in dev docs

The following tests are now explicitly referenced in both repo and in-game development docs:

- `frontend/__tests__/questQuality.test.js`
- `frontend/__tests__/questCanonical.test.js`
- `frontend/__tests__/questDependencies.test.js`
- `frontend/__tests__/questSimulation.test.js`
- `frontend/__tests__/questValidation.test.js`
- `frontend/__tests__/questTemplateValidation.test.js`
- `frontend/__tests__/questImage.test.js`
- `scripts/tests/imageReferences.test.ts`

## Missing problem class identified

### Class: Livestock transfer safety omissions in aquaria quests

**Reliability impact:**

- Players can complete fish transfer quests without explicit checks for toxic nitrogen compounds.
- Quests can under-spec acclimation guidance, increasing the chance of fish stress during transfer.

**Why existing tests missed it:**

- `questQuality.test.js` had broad aquarium ethics checks, but did not require explicit
  `ammonia` + `nitrite` mentions or acclimation wording for transfer-centric quests.

## New test design

### Rule

For livestock transfer quests (`aquaria/guppy`, `aquaria/goldfish`, `aquaria/net-fish`):

1. Quest text/options must mention both `ammonia` and `nitrite`.
2. Quest text/options must include acclimation guidance (e.g., acclimate/acclimation/drip/float bag).

### Implementation location

- Added `checkLivestockTransferSafety` and a dedicated Jest assertion in
  `frontend/__tests__/questQuality.test.js`.

## Quest improvements applied

### Affected quests

- `frontend/src/pages/quests/json/aquaria/guppy.json`
- `frontend/src/pages/quests/json/aquaria/goldfish.json`
- `frontend/src/pages/quests/json/aquaria/net-fish.json`

### What was wrong and what changed

3. **`aquaria/guppy`**
   - **Issue:** Guppy introduction text covered temperature/stress but did not explicitly call out
     ammonia + nitrite pre-checks.
   - **Change:** Updated start/acclimation dialogue to require ammonia/nitrite verification and
     reinforce acclimation wording.

1. **`aquaria/goldfish`**
   - **Issue:** Transfer flow text did not explicitly require ammonia/nitrite checks and lacked clear
     acclimation wording in transfer execution steps.
   - **Change:** Updated start/baseline/catch nodes to explicitly require ammonia + nitrite safety
     checks and include acclimation pause language before reintroduction.

1. **`aquaria/net-fish`**
   - **Issue:** Similar omission of explicit ammonia/nitrite verification and acclimation phrasing in
     a fish transfer quest.
   - **Change:** Updated start/baseline/catch nodes to include explicit ammonia + nitrite checks and
     acclimation transfer wording.

## Follow-up classes worth adding later

- Process output evidence rules for quests that depend on repeated logging artifacts.
- Stronger anti-loop constraints for process options that can trap players in infinite re-run paths.
- Domain-specific safety dictionaries for other high-risk trees (chemistry/electronics/rocketry).
