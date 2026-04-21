# title
ProcessForm expected error-path log noise

## symptom
ProcessForm tests logged expected save failures and fallback warnings to stderr.

## root cause
Tests intentionally exercised validation and failed-update branches that call `console.error`/`console.warn`.

## fix
Added test-local console spies in `ProcessForm.spec.ts` to contain expected logs.

## verification
- `npm run test:root -- frontend/src/components/__tests__/ProcessForm.spec.ts`
