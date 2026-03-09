# Quest quality & reliability gap closure (v3)

## Context

We reviewed all quest-focused quality tests in DSPACE and compared their enforcement scope against
actual quest content and existing developer docs. This design note records what was missing,
what quality classes were added, and which quests were corrected.

## Quest quality test inventory reviewed

- `frontend/__tests__/questQuality.test.js`
- `frontend/__tests__/questCanonical.test.js`
- `frontend/__tests__/questDependencies.test.js`
- `frontend/__tests__/questSimulation.test.js`
- `frontend/__tests__/questTemplateValidation.test.js`
- `frontend/__tests__/questValidation.test.js`
- `scripts/tests/questDependencies.test.ts`
- `scripts/tests/questQuality.test.ts`
- `tests/questCompletableItems.test.ts`
- `tests/questCopyRegression.test.ts`
- `tests/questDependencyReferences.test.ts`
- `tests/questDialogueValidation.test.ts`
- `tests/questGraphValidation.test.ts`
- `tests/questPrerequisites.test.ts`
- `tests/questProcessCoverage.test.ts`
- `tests/questProcessNecessitySimulation.test.ts`
- `tests/questRewardsValidation.test.ts`
- `tests/questSchemaValidation.test.ts`
- `tests/quest-title-unique.test.ts`
- `tests/sysadminQuestQuality.test.ts`

## Missing quality/reliability classes identified

### 1) Generic remediation loop copy in quiz branches

**Problem class:** Player guidance quality / remediation clarity.

**Why this mattered:**
- Existing tests verify many structural concerns (schema, completion, dependencies, process use,
  prerequisites, rewards), but none enforced readability quality for retry loops in quiz quests.
- Two sysadmin quests used bare `"Retry"` labels in remediation nodes, which gave weak context on
  what the player is retrying.

**New quality rule:**
- Add a gate that fails when a `retry-*` node routes back to a `quiz-*` node with generic copy
  (`retry`, `try again`, `again`) instead of specific guidance.

## Implementation

### New test added

- `tests/questQuizRetryCopyQuality.test.ts`
    - Scans all quest JSON files.
    - Targets retry nodes (`retry-*`) that return to quiz nodes (`quiz-*`).
    - Fails if remediation option text is generic and non-specific.

### Quests affected and corrected

1. `frontend/src/pages/quests/json/sysadmin/resource-monitoring.json`
   - **Before:** retry options were plain `"Retry"`.
   - **After:** retry options are explicit, e.g. `"Retry question 3 with a command-focused answer"`.

2. `frontend/src/pages/quests/json/sysadmin/log-analysis.json`
   - **Before:** retry options were plain `"Retry"`.
   - **After:** retry options are explicit, e.g. `"Retry question 4 with a command-focused answer"`.

## Documentation updates made

To keep development and in-game docs aligned with quality enforcement, we added an explicit quest
quality test catalog in both places:

- Repository-facing docs: `frontend/TESTING.md`
- In-game docs: `frontend/src/pages/docs/md/testing-guide.md`

We also updated the sysadmin tree QA notes to document the retry-copy requirement and the concrete
behavior in affected quests:

- `frontend/src/pages/docs/md/sysadmin.md`

## Follow-up guidance

When adding new quest quality gates, update both catalogs (`frontend/TESTING.md` and
`/docs/testing-guide`) in the same PR so contributors can discover and run the exact suite.
