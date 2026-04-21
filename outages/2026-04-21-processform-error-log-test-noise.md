# ProcessForm error log test noise

## title
ProcessForm error log test noise

## symptom
ProcessForm tests printed expected save failures (`Process ID is missing`, `Update failed`).

## root cause
Negative-path tests intentionally trigger failure states while component logs errors.

## fix
Added test-local console warn/error spies and ensured item fixture includes dUSD currency record to prevent unrelated warnings.

## verification
`npm run test:root -- frontend/src/components/__tests__/ProcessForm.spec.ts`
