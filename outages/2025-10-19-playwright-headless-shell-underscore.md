# 2025-10-19-playwright-headless-shell-underscore

- **Date:** 2025-10-19
- **Component:** ci:e2e
- **Root cause:** Playwright 1.56 renamed the Chromium headless_shell download directory to use underscores, but ensurePlaywrightBrowsers still checked for the older hyphenated folder. The helper concluded Chromium was missing even after installation and aborted the shard before tests ran.
- **Resolution:** Updated resolveHeadlessShellPath to detect both hyphenated and underscored headless directories and expanded the unit suite to cover the underscore layout.
- **References:**
  - https://github.com/democratizedspace/dspace/actions/runs/18605256329/job/53053162559
  - frontend/scripts/utils/ensure-playwright-browsers.js
  - scripts/tests/ensurePlaywrightBrowsers.test.ts
