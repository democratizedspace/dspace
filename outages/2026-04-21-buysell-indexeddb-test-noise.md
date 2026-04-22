# BuySell IndexedDB test noise

## Symptom
Item page tests logged `Failed to load item from IndexedDB in BuySell.svelte` during intentional fallback paths.

## Root cause
Negative-path data loading in tests exercised error logging without local console spies.

## Fix
Added test-local `console.error` spy suppression in `ItemPage.spec.ts` to keep stderr clean while preserving behavior assertions.

## Verification
`npm test` and targeted item page tests run cleanly.
