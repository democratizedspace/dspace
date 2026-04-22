# Playwright deps sentinel parent-dir warning

## Symptom
Test stderr emitted:
`Unable to create Playwright deps sentinel file at /workspace/dspace/frontend/.playwright-deps-installed: ENOENT...`.

## Root cause
Playwright helper tests hardcoded `/workspace/dspace/frontend` and only mocked `existsSync`/`writeFileSync`.
In environments where that absolute path is absent, sentinel `mkdirSync`/`writeFileSync` emitted `ENOENT`
warnings to stderr.

## Fix
Made tests path-agnostic (`path.resolve(process.cwd(), 'frontend')`) and injected `mkdirSync` mocks
alongside `writeFileSync` so sentinel creation remains isolated from host filesystem layout.

## Verification
`npm run test:root -- scripts/tests/ensurePlaywrightBrowsers.test.ts frontend/tests/ensure-playwright-browsers.test.ts`
