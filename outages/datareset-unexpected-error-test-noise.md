# title
DataReset unexpected-error branch stderr noise

## symptom
`DataReset.spec.ts` emitted expected wipe-failure logs for null `indexedDB` scenarios.

## root cause
The test intentionally drives the component's error branch, which logs diagnostics.

## fix
Added test-local `console.error` spying in `DataReset.spec.ts`.

## verification
- `npm run test:root -- frontend/src/components/__tests__/DataReset.spec.ts`
