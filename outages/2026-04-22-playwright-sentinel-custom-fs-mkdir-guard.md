# Playwright deps sentinel custom-fs mkdir guard

## Symptom
Root and frontend Playwright helper tests emitted stderr like:
`Unable to create Playwright deps sentinel directory for /workspace/dspace/frontend/...: ENOENT`.

## Root cause
`ensurePlaywrightSystemDeps` accepted injected fs adapters for testing but still fell back to real
`node:fs.mkdirSync` when the adapter omitted `mkdirSync`, causing real host-path mkdir attempts.

## Fix
Only run sentinel parent-directory creation when the selected fs adapter provides a `mkdirSync`
function, while keeping normal runtime behavior unchanged.

## Verification
- `npm run test:root -- scripts/tests/ensurePlaywrightBrowsers.test.ts frontend/tests/ensure-playwright-browsers.test.ts`
- `npm test`
