# ProcessForm error log test noise

## Symptom
Process form tests emitted expected error-path logs (`Failed to save process ...`).

## Root cause
Tests intentionally hit failing submit branches but did not mock console output.

## Fix
Added test-local `console.error`/`console.warn` spies in `ProcessForm.spec.ts`.

## Verification
`npm test` shows no process form stderr noise.
