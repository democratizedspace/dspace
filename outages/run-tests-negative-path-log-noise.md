# run-tests negative-path stderr noise

## title
run-tests negative-path stderr noise

## symptom
run-tests and run-test-groups negative cases printed expected failure diagnostics to stderr.

## root cause
Tests intentionally simulate command failures and timeout retries that log via console.error.

## fix
Added test-local console.error spies in affected negative-path tests.

## verification
- npx vitest run -c vitest.config.mts scripts/tests/run-tests.test.ts tests/run-test-groups.test.ts
