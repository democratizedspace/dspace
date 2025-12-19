# 2025-10-17-playwright-expect-poll-regression

- **Date:** 2025-10-17
- **Component:** ci:e2e
- **Root cause:** Playwright 1.54 removed expect.poll().setTimeout, so expectLocalStorageValue crashed before reading the avatar URL
- **Resolution:** Use expect.poll timeout options and add a regression Playwright spec that covers string, regex, and null values
- **References:**
  - https://github.com/democratizedspace/dspace/actions/runs/18586257662/job/52990714065
  - https://github.com/democratizedspace/dspace/actions/runs/18586257662/job/52990714057
