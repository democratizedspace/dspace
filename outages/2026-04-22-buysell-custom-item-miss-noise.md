# BuySell custom item miss stderr noise

## Symptom
Test output emitted noisy stderr:
`Failed to load item from IndexedDB in BuySell.svelte ... item not found with id: custom-item-foobar`.

## Root cause
`BuySell.svelte` logged `console.error` for expected missing-item lookups in test fixtures where custom item data is intentionally absent.

## Fix
Treat expected `item not found with id:` lookup misses as non-error control flow and keep error logging for unexpected failures.

## Verification
`npm run test:root`
