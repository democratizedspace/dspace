# Playwright deps sentinel parent-dir warning

## Symptom
Test stderr emitted:
`Unable to create Playwright deps sentinel file at /workspace/dspace/frontend/.playwright-deps-installed: ENOENT...`.

## Root cause
`ensurePlaywrightSystemDeps` attempted to write the sentinel file without first ensuring parent directory existence.

## Fix
Created the sentinel parent directory recursively before writing the sentinel file.

## Verification
`npm run test:root -- scripts/tests/ensurePlaywrightBrowsers.test.ts`
