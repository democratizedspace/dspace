# playwright-install-deps-regression

- **Date:** 2025-10-29
- **Component:** frontend-e2e
- **Root cause:** ensurePlaywrightBrowsers installed Chromium binaries but never triggered playwright install-deps, leaving system libraries like libatk1.0-0t64 missing. Chromium crashed on launch and every e2e test failed.
- **Resolution:** Teach ensurePlaywrightBrowsers to run playwright install-deps on Linux (with a sentinel file) before downloading browsers, and cover the behavior with vitest mocks.
- **References:**
  - https://github.com/democratizedspace/dspace/actions/runs/18621659400/job/53093627151
