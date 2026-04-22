# run-tests negative-path log noise

## Symptom
`run-tests` and `run-test-groups` negative-path tests printed expected failure logs to stderr.

## Root cause
Failure-mode tests asserted return codes but left `console.error` unmocked.

## Fix
Added local `console.error` spies in the affected negative-path tests and set
`SKIP_E2E=1` for the `prepare-pr` invocation inside `run-tests.js` so the
launch-gate test command does not emit unrelated E2E output noise.

## Verification
`npm test` runs run-tests suites with clean output.
