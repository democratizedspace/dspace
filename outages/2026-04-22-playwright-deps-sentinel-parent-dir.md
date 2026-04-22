# Playwright deps sentinel parent-directory warning

## Symptom
Test stderr contained:
`Unable to create Playwright deps sentinel file ... ENOENT: no such file or directory`.

## Root cause
`ensurePlaywrightSystemDeps` attempted to write the sentinel file without ensuring the parent
directory exists.

## Fix
Create the sentinel parent directory with `mkdirSync(..., { recursive: true })` before writing.

## Verification
`npm run test:root -- scripts/tests/ensurePlaywrightBrowsers.test.ts`
