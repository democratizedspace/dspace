# BuySell IndexedDB test noise

## title
BuySell IndexedDB test noise

## symptom
Item page tests printed expected error-path logs for missing custom IndexedDB item resolution.

## root cause
Test exercised a path that intentionally probes custom content lookups and logged to console.error.

## fix
Scoped console error spying in affected ItemPage regression test to keep expected negative-path output out of suite stderr.

## verification
`npm run test:root -- frontend/src/pages/inventory/item/__tests__/ItemPage.spec.ts`
