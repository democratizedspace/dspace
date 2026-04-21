# Playwright deps sentinel test noise

## title
Playwright deps sentinel test noise

## symptom
Playwright deps tests emitted sentinel-file write warnings in path-mismatched environments.

## root cause
Test hard-coded a repo path that can differ across environments.

## fix
Normalized test repo root path from `__dirname` and captured expected proxy warning via spy in placeholder-proxy scenario.

## verification
`npm run test:root -- scripts/tests/ensurePlaywrightBrowsers.test.ts`
