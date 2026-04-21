# run-tests negative-path log noise

## title
run-tests negative-path log noise

## symptom
`run-tests` unit tests for failure paths emitted expected error output to stderr.

## root cause
Tests exercised deliberate failures and retries but did not intercept stderr writes.

## fix
Added stderr write spies in the negative-path run-tests unit test cases.

## verification
`npm run test:root -- scripts/tests/run-tests.test.ts tests/run-test-groups.test.ts`
