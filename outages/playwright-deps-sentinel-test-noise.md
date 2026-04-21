# Playwright deps sentinel warning noise in tests

## title
Playwright deps sentinel warning noise in tests

## symptom
ensurePlaywrightBrowsers test output included sentinel write warning and proxy warning noise.

## root cause
Test scenarios exercise install-deps code paths that intentionally warn in edge conditions.

## fix
Added test-local console.warn suppression in ensurePlaywrightBrowsers tests to keep expected-path stderr quiet.

## verification
- npx vitest run -c vitest.config.mts scripts/tests/ensurePlaywrightBrowsers.test.ts
