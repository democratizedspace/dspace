# navigateWithRetry retry log noise

## title
navigateWithRetry retry log noise

## symptom
Retry helper tests emitted expected warning logs for simulated connection refusals.

## root cause
`navigateWithRetry` logs retry warnings by design; tests intentionally trigger retry paths.

## fix
Added console.warn spies in retry-path tests while keeping retry behavior assertions unchanged.

## verification
`npm run test:root -- tests/navigateWithRetry.test.ts tests/purgeClientStateRetry.test.ts`
