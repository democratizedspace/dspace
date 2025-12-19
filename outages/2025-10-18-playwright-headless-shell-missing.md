# playwright-headless-shell-missing

- **Date:** 2025-10-18
- **Component:** ci:e2e
- **Root cause:** The split e2e workflow ran after a Playwright upgrade that now requires the Chromium headless_shell binary, but our browser bootstrapper only validated the chrome executable. It skipped installing browsers, so the shard job crashed because headless_shell was absent.
- **Resolution:** Updated ensurePlaywrightBrowsers to verify the headless shell path before skipping installs and added unit tests that fail if the headless executable is missing.
- **References:**
  - frontend/scripts/utils/ensure-playwright-browsers.js
  - scripts/tests/ensurePlaywrightBrowsers.test.ts
  - github-actions:e2e-shard-1-18603193494-53046387287
