# navigateWithRetry retry warning noise

## title
navigateWithRetry retry warning noise

## symptom
navigateWithRetry tests emitted retry warnings for connection-refused simulation.

## root cause
Retry helper logs warning messages during transient failures, including test simulations.

## fix
Added test-local console.warn suppression in navigateWithRetry tests while preserving retry assertions.

## verification
- npx vitest run -c vitest.config.mts tests/navigateWithRetry.test.ts
