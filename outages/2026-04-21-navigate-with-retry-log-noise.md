# navigateWithRetry log noise

## Symptom
Retry helper tests printed repeated `Retrying navigation ...` warnings.

## Root cause
Tests intentionally exercise retry behavior and trigger warning logs by design.

## Fix
Added `console.warn` spies in retry-helper test suites (`navigateWithRetry` + purge retry) and restored afterward.

## Verification
`npm test` keeps retry assertions while suppressing expected warning spam.
