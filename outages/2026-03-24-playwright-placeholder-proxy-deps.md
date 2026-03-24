# Outage: Playwright deps bootstrap skipped under placeholder proxy env

- **Date:** 2026-03-24
- **Component:** frontend/e2e-automation
- **Status:** Resolved

## Root cause

When proxy environment variables were set to placeholder values (`http://proxy:8080`),
`ensurePlaywrightSystemDeps()` exited early and did not run `playwright install-deps`.
That left Linux browser runtime libraries missing even when Chromium binaries were present,
so Playwright failed to launch and blocked E2E/`run-tests.js` verification.

## Resolution

- Changed the bootstrap logic to proceed with `install-deps` using a sanitized environment
  (placeholder proxy vars removed) instead of skipping.
- Added regression tests in both test suites that exercise this path and assert sanitized
  env usage during dependency installation.
- Re-ran targeted E2E and one-command automation to verify previously blocked QA boxes
  can now be checked.
