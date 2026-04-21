# BuySell IndexedDB expected-error test noise

## title
BuySell IndexedDB expected-error test noise

## symptom
Item page test printed BuySell IndexedDB load error to stderr for negative-path fixture data.

## root cause
Test intentionally exercises a path where custom item is missing from IndexedDB and component logs diagnostic error.

## fix
Added test-local console.error spy in ItemPage spec to contain expected negative-path noise.

## verification
- npx vitest run -c vitest.config.mts frontend/src/pages/inventory/item/__tests__/ItemPage.spec.ts
