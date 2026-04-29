# Outage: repeated Playwright headless-shell missing warnings during grouped E2E

- **Date:** 2026-04-29
- **Component:** `frontend/scripts/utils/ensure-playwright-browsers.js`
- **Severity:** low (log-noise, not functional failure)

## Symptom

`npm run test:e2e:groups` repeatedly logged:

`Playwright chromium headless shell is still missing after installation. Tests may fail if browsers are unavailable.`

The warning appeared in each Playwright invocation group, even though tests still passed.

## Root cause

The bootstrap helper treated `chromium-headless-shell` as a required asset for success checks.
However, this suite runs Chromium with `--headless=new`, which uses the regular Chromium binary.
In that mode, the headless shell artifact is optional for these tests, so the detector produced false
missing-asset warnings.

Because grouped runs spawn Playwright multiple times, the same false warning was emitted repeatedly.

## Fix

- Updated Playwright asset validation to require Chromium executable presence by default.
- Kept headless-shell checks available behind an explicit opt-in (`PLAYWRIGHT_REQUIRE_HEADLESS_SHELL=1`)
  for environments that truly depend on shell-mode validation.
- Updated helper regression coverage to assert the new default behavior.

## Verification commands

- `npx vitest run -c vitest.config.mts frontend/tests/ensure-playwright-browsers.test.ts scripts/tests/ensurePlaywrightBrowsers.test.ts`
- `npm run test:e2e:groups`
- `npm test`

## Why tests passed despite the warning

The warning was a false positive from bootstrap validation logic. Playwright still had a usable Chromium
binary and successfully launched tests in modern headless mode.
