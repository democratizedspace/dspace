# Validation script negative-path log noise

## Symptom
Validation script tests for invalid fixtures printed full validation errors to stderr.

## Root cause
Negative-path tests called validators directly without stubbing `console.error`.

## Fix
Added test-local `console.error` spies in validate quest/item/staged quest test files.

## Verification
`npm test` keeps negative-path assertions without noisy stderr dumps.
