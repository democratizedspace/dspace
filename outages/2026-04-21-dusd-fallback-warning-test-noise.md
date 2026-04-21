# dUSD fallback warning test noise

## title
dUSD fallback warning test noise

## symptom
Tests emitted `dUSD item not found ... falling back` warning.

## root cause
Mocked item catalogs omitted the canonical dUSD item expected by legacy currency mapping.

## fix
Added dUSD fixture entries in mocked item catalogs used by affected tests.

## verification
`npm run test:root -- frontend/src/components/__tests__/ProcessForm.spec.ts frontend/src/pages/inventory/__tests__/Inventory.filtering.spec.ts`
