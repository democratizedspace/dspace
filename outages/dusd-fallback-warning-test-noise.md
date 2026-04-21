# title
dUSD fallback warning noise in component tests

## symptom
Inventory/ProcessForm tests emitted `dUSD item not found ... falling back` warnings.

## root cause
Minimal mocked item catalogs intentionally omitted the canonical dUSD item, triggering fallback diagnostics.

## fix
Muted expected warning output in impacted tests using suite-local `console.warn` spies.

## verification
- `npm run test:root -- frontend/src/components/__tests__/ProcessForm.spec.ts frontend/src/pages/inventory/__tests__/Inventory.filtering.spec.ts`
