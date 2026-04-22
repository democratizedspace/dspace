# Prettier formatting launch-gate failure

## Symptom
`scripts/tests/prettierFormatting.test.ts` failed because `npm run format:check` reported:
- `__tests__/migrations.test.js`
- `__tests__/offlineWorkerRegistration.test.js`
- `src/utils/legacySaveParsing.js`

## Root cause
Frontend format-check gate requires these files to resolve cleanly under frontend Prettier config.

## Fix
Re-ran targeted frontend Prettier checks/write pass for the three files and revalidated format gate output.

## Verification
`cd frontend && npx prettier --config .prettierrc --write __tests__/migrations.test.js __tests__/offlineWorkerRegistration.test.js src/utils/legacySaveParsing.js`
