# Outage: Repeated Playwright headless-shell missing warnings during grouped E2E

## Symptom

Grouped E2E runs printed this warning repeatedly:

- `Playwright chromium headless shell is still missing after installation. Tests may fail if browsers are unavailable.`

The warning appeared for multiple groups even when all tests passed.

## Root cause

`ensurePlaywrightBrowsers` treated a missing `chromium-headless-shell` artifact as a post-install warning condition, even when Chromium was present and runnable for the active test launch path.

Because Playwright configuration executes in each grouped invocation, this warning was emitted repeatedly and looked like an install failure loop.

## Fix

- Kept browser installation logic intact.
- Narrowed the post-install warning condition to only missing Chromium executable.
- Added regression coverage asserting we do not emit the post-install headless-shell warning when Chromium exists.

## Verification commands

- `npm run test:root -- frontend/tests/ensure-playwright-browsers.test.ts`
- `npm run test:e2e:groups`

## Why tests passed despite warning

Playwright can run the configured tests with the Chromium executable already present; the missing headless-shell warning was noisy but non-blocking for this configuration.
