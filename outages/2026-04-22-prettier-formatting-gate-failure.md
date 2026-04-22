# Prettier formatting launch-gate failure

## Symptom
`scripts/tests/prettierFormatting.test.ts` failed because `npm run format:check` reported:
- `__tests__/migrations.test.js`
- `__tests__/offlineWorkerRegistration.test.js`
- `src/utils/legacySaveParsing.js`

## Root cause
Frontend format-check gate requires these files to resolve cleanly under frontend Prettier config.

## Fix
Re-validated the three reported frontend files under `frontend/.prettierrc` and confirmed
the format gate now passes without additional source edits.

## Verification
`cd frontend && npm run format:check`
