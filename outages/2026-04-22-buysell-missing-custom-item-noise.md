# BuySell missing custom item lookup test noise

## Symptom
Test stderr contained:
`Failed to load item from IndexedDB in BuySell.svelte` for `custom-item-foobar`
with `item not found with id: custom-item-foobar`.

## Root cause
`BuySell.svelte` treated expected "not found" lookups as error-level failures and logged `console.error`
during negative-path test flows.

## Fix
Kept missing-item behavior (`Item not found`) but suppressed error logging specifically for expected
`not found with id` misses; unexpected IndexedDB errors are still logged.

## Verification
`npm run test:root -- frontend/src/pages/inventory/item/__tests__/ItemPage.spec.ts`
