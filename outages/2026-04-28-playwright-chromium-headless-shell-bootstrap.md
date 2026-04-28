# Playwright Chromium headless shell bootstrap warning

## Warning
Grouped E2E output repeatedly logged:

- `headless shell is missing`
- `Proceeding with chromium binary only`

## Impact
- QA runs were noisy and harder to triage because each group re-printed the same warning.
- Setup implied Playwright was healthy even when required Chromium assets were incomplete.

## Root cause
`ensurePlaywrightBrowsers` used `hasChromiumExecutable` as the readiness gate. That helper returned `true`
even when the Chromium `headless_shell` binary was missing, so install was skipped and warnings repeated
for each grouped Playwright invocation.

## Fix
- Changed the readiness check so missing `headless_shell` returns `false`.
- Kept the missing-headless warning, but now it is emitted before triggering install.
- Added/updated tests to verify that when headless shell is missing, browser install runs and grouped
  reruns do not keep reinstalling once assets are present.

## Verification
- `npm --prefix frontend run playwright:install`
- `npm --prefix frontend run test:e2e:groups`
- `npm run lint`
- `npm run type-check`
- `npm run build`
- `npm test`
- `node scripts/link-check.mjs`
