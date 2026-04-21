# dUSD fallback warning noise in tests

## title
dUSD fallback warning noise in tests

## symptom
Tests with mocked item catalogs emitted dUSD fallback warning from legacy id map bootstrap.

## root cause
Mock catalogs omitted dUSD, causing fallback warning during module import.

## fix
Added canonical dUSD item to mocked item fixtures in ProcessForm and Inventory filtering specs.

## verification
- npx vitest run -c vitest.config.mts frontend/src/components/__tests__/ProcessForm.spec.ts frontend/src/pages/inventory/__tests__/Inventory.filtering.spec.ts
