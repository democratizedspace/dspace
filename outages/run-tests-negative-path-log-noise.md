# title
run-tests / run-test-groups negative-path stderr noise

## symptom
Script tests printed expected failure output from intentionally failing branches.

## root cause
These suites validate error handling by triggering failures that write to stderr.

## fix
Added `process.stderr.write` spies in script tests to suppress expected negative-path noise.

## verification
- `npm run test:root -- scripts/tests/run-tests.test.ts tests/run-test-groups.test.ts`
