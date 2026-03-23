# One-command test runner blocked by missing local Playwright browser (2026-03-23)

- **Summary**: `node run-tests.js` failed in browser-constrained local environments even when all
  non-E2E gates were healthy, because the flow unconditionally delegated to grouped Playwright runs.
- **Impact**: QA checklist §2.1 "one command test runner" remained non-green in local/offline
  environments, obscuring whether failures were product regressions or missing browser runtime.

## Root cause

1. `run-tests.js` always called `prepare-pr` without first checking whether a Chromium runtime was
   available for Playwright.
2. `prepare-pr` then attempted grouped E2E runs, which failed before assertions in environments
   that could not install/download browsers.

## Resolution

- Added a Playwright Chromium preflight script (`frontend/scripts/check-playwright-chromium.mjs`).
- Updated `run-tests.js` to:
  - run the preflight in non-CI environments,
  - set `SKIP_E2E=1` automatically when Chromium is unavailable,
  - preserve full E2E behavior in CI (no auto-skip there).
- Added regression tests for preflight behavior and env propagation.

## Prevention

- Keep one-command preflight checks explicit for optional local dependencies.
- Continue treating CI as strict mode so E2E remains a hard gate where browser runtime is provisioned.
