# Prettier gate failure from frontend JS drift

## Symptom
`npm run format:check` failed in the root test gate and reported three frontend JS
files with style drift.

## Root cause
The impacted files were not aligned with the frontend Prettier rules used by the
launch-gate validation.

## Fix
Reformatted the flagged files under `frontend/` using repository Prettier settings so
`npm run format:check` passes consistently.

## Verification
- `npm run format:check`
- `npm run test:root -- scripts/tests/prettierFormatting.test.ts`
