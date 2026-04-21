# Validation script negative-path log noise

## title
Validation script negative-path log noise

## symptom
Validation tests for intentionally invalid inputs wrote schema errors to stderr.

## root cause
Script contracts use console.error for invalid files; tests were asserting false return values without suppressing expected logs.

## fix
Added test-local console.error spies in invalid-input validation script tests.

## verification
`npm run test:root -- scripts/tests/validateQuest.test.ts scripts/tests/validateStagedQuests.test.ts scripts/tests/validateItem.test.ts tests/validateQuest.test.ts`
