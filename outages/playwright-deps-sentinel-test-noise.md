# Playwright deps sentinel test noise

## Symptom
Playwright bootstrap tests emitted sentinel/proxy warnings on expected paths.

## Root cause
Tests validated placeholder-proxy and sentinel paths without consuming warning output explicitly.

## Fix
Added explicit `console.warn` spy/assertion around the placeholder proxy test path.

## Verification
`npm test -- scripts/tests/ensurePlaywrightBrowsers.test.ts` passes without unhandled warning noise.
