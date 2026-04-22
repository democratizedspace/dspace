# Prettier launch-gate formatting failure

## Symptom
`scripts/tests/prettierFormatting.test.ts` failed because `npm run format:check` reported:
- `__tests__/migrations.test.js`
- `__tests__/offlineWorkerRegistration.test.js`
- `src/utils/legacySaveParsing.js`

## Root cause
Repository formatting gate identified drift in the listed files during the QA chain.

## Fix
Ran frontend Prettier check/write using the frontend config path to normalize formatting in-scope.

## Verification
`npm run format:check`
