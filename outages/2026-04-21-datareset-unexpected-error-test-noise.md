# DataReset unexpected-error test noise

## title
DataReset unexpected-error test noise

## symptom
DataReset negative-path test emitted `Failed to wipe all app data` stack traces.

## root cause
Test intentionally forces IndexedDB absence and component logs diagnostic error.

## fix
Added targeted console.error spy inside the negative-path DataReset test while preserving behavioral assertions.

## verification
`npm run test:root -- frontend/src/components/__tests__/DataReset.spec.ts`
