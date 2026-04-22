# DataReset unexpected error test noise

## Symptom
Data reset negative-path test printed `Failed to wipe all app data ...`.

## Root cause
The test intentionally passes `indexedDB = null`, triggering expected catch logging.

## Fix
Added test-local `console.error` suppression in `DataReset.spec.ts`.

## Verification
`npm test` runs DataReset suite without stderr noise.
