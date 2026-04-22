# Prettier formatting regression

## Symptom
`scripts/tests/prettierFormatting.test.ts` failed because `npm run format:check` reported formatting drift in three frontend files.

## Root cause
The check is executed from the frontend workspace and requires frontend Prettier config/resolution.

## Fix
Ran frontend Prettier against the three listed files and confirmed formatting is compliant.

## Verification
`cd frontend && npx prettier --write __tests__/migrations.test.js __tests__/offlineWorkerRegistration.test.js src/utils/legacySaveParsing.js` and `npm run format:check`.
