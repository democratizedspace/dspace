# ProcessForm negative-path stderr noise

## title
ProcessForm negative-path stderr noise

## symptom
ProcessForm tests printed expected save-failure errors to stderr.

## root cause
Negative-path tests intentionally trigger missing process id/update failures while component logs errors.

## fix
Added test-local console.error/warn suppression and included dUSD fixture item to avoid unrelated warnings.

## verification
- npx vitest run -c vitest.config.mts frontend/src/components/__tests__/ProcessForm.spec.ts
