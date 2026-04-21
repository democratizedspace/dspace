# title
Validation script negative-path stderr noise

## symptom
Quest/item validation tests printed schema error payloads to stderr for intentionally invalid fixtures.

## root cause
Validator modules log errors by design when validation fails; tests assert failure booleans.

## fix
Added `console.error` spies in validation-script tests to keep negative-path runs quiet while preserving behavior assertions.

## verification
- `npm run test:root -- tests/validateQuest.test.ts scripts/tests/validateQuest.test.ts scripts/tests/validateItem.test.ts scripts/tests/validateStagedQuests.test.ts`
