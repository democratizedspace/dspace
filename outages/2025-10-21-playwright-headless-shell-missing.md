# 2025-10-21-playwright-headless-shell-missing

- **Date:** 2025-10-21
- **Component:** frontend/e2e
- **Root cause:** CI sharded Playwright jobs attempted to launch Chromium without the chromium headless shell binary because our setup script invoked the Playwright CLI via npx without explicitly requesting the headless shell download.
- **Resolution:** Updated ensure-playwright-browsers to call the local Playwright CLI directly and install chromium-headless-shell alongside chromium so headless launches succeed in CI.
- **References:**
  - https://github.com/democratizedspace/dspace/actions/runs/18610825343/job/53068671174
  - https://github.com/democratizedspace/dspace/actions/runs/18610825343/job/53068671177
