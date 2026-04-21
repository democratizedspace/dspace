# Validation script negative-path stderr noise

## title
Validation script negative-path stderr noise

## symptom
Validation unit tests for invalid fixtures printed expected schema errors to stderr.

## root cause
Negative tests intentionally invoke validator error paths that log validation failures.

## fix
Added test-local console.error spies across validate quest/item/staged-quest tests.

## verification
- npx vitest run -c vitest.config.mts tests/validateQuest.test.ts scripts/tests/validateQuest.test.ts scripts/tests/validateStagedQuests.test.ts scripts/tests/validateItem.test.ts
