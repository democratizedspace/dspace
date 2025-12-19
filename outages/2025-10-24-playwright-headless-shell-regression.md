# playwright-headless-shell-regression

- **Date:** 2025-10-24
- **Component:** frontend-e2e
- **Root cause:** Playwright 1.54 skipped downloading chromium_headless_shell, so e2e shards crashed on launch.
- **Resolution:** Call ensurePlaywrightBrowsers() in playwright.config.ts so each run installs Chromium shell. Add a regression test.
- **References:**
  - https://github.com/democratizedspace/dspace/actions/runs/18611896671/job/53071209401
  - https://github.com/democratizedspace/dspace/actions/runs/18611896671/job/53071209417
