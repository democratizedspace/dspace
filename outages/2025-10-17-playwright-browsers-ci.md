# 2025-10-17-playwright-browsers-ci

- **Date:** 2025-10-17
- **Component:** tests
- **Root cause:** Playwright Chromium binaries were not installed before the split e2e workflows executed, so each test crashed with a missing headless_shell executable.
- **Resolution:** frontend/scripts/setup-test-env.js now bootstraps Playwright browsers via ensurePlaywrightBrowsers() and the helper is covered by unit tests to guarantee we run the install when binaries are absent.
- **References:**
  - https://github.com/democratizedspace/dspace/actions/runs/18586257662
  - frontend/scripts/utils/ensure-playwright-browsers.js
  - scripts/tests/ensurePlaywrightBrowsers.test.ts
