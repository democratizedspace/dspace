# title
navigateWithRetry retry-log stderr noise in unit tests

## symptom
Retry tests printed connection-refusal retry lines to stderr.

## root cause
The helper intentionally logs retry attempts when simulating connection failures.

## fix
Added `process.stderr.write` spies in retry-focused tests to keep expected retries from polluting gate logs.

## verification
- `npm run test:root -- tests/navigateWithRetry.test.ts tests/purgeClientStateRetry.test.ts`
