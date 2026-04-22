# v3.0.1 Prettier three-file gate drift

## Symptom
`scripts/tests/prettierFormatting.test.ts` failed because `npm run format:check` flagged:
- `frontend/__tests__/migrations.test.js`
- `frontend/__tests__/offlineWorkerRegistration.test.js`
- `frontend/src/utils/legacySaveParsing.js`

## Root cause
Launch-gate formatting checks run from the frontend workspace and fail on any frontend file that
is not aligned with `frontend/.prettierrc`.

## Fix
Rechecked the reported files against the frontend Prettier config and validated the launch-gate
formatting check passes cleanly.

## Verification
- `cd frontend && npm run format:check`
- `npm run test:root -- scripts/tests/prettierFormatting.test.ts`
