# Playwright headless shell bootstrap warning spam in grouped E2E

## Symptom
Grouped Playwright runs (`npm run test:e2e:groups`) repeatedly logged:

- `headless shell is missing`
- `Proceeding with chromium binary only`

This message appeared across multiple E2E groups even when Chromium itself existed.

## Impact
The warning was noisy and obscured QA signal. It also meant local/CI setup could proceed without
all required Chromium assets, leaving each test process to rediscover the same gap.

## Root cause
The shared bootstrap helper (`ensurePlaywrightBrowsers`) accepted the install as complete when the
Chromium executable existed, even if `chromium-headless-shell` was absent. Because of that early
return, grouped E2E invocations never triggered a corrective Playwright install path.

## Fix
- Tightened Playwright asset validation to require **both** Chromium and the headless shell.
- If headless shell is missing, bootstrap now executes the standard Playwright install workflow
  before test groups run.
- Added regression coverage to assert missing-headless-shell paths trigger installation instead of
  warning-only behavior.

## Verification
- `npm --prefix frontend run playwright:install`
- `npm --prefix frontend run test:e2e:groups`
- Grouped E2E logs no longer emit the repeated missing-headless-shell warning pair.
