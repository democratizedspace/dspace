# DataReset unexpected-error test noise

## title
DataReset unexpected-error test noise

## symptom
DataReset spec printed expected wipe failure stack traces to stderr.

## root cause
Test intentionally sets indexedDB to null to validate fallback warning behavior; component logs error diagnostics.

## fix
Added test-local console.error spy in DataReset spec so expected failure-path logs do not pollute output.

## verification
- npx vitest run -c vitest.config.mts frontend/src/components/__tests__/DataReset.spec.ts
