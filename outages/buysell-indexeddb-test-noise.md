# title
BuySell IndexedDB error-path noise in ItemPage tests

## symptom
ItemPage tests printed IndexedDB load errors for custom-item negative paths.

## root cause
Negative-path rendering in jsdom intentionally triggers component error logging.

## fix
Added test-local `console.error` spies in `ItemPage.spec.ts` to suppress expected error-path noise.

## verification
- `npm run test:root -- frontend/src/pages/inventory/item/__tests__/ItemPage.spec.ts`
