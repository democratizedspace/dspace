# 2025-10-17-playwright-browser-install-filter

- **Date:** 2025-10-17
- **Component:** ci:e2e
- **Root cause:** CI invoked pnpm with the ./frontend filter for playwright install, which matches no workspace package, so browsers were never installed and every E2E launch failed
- **Resolution:** Run pnpm commands from the frontend directory using --dir so Playwright browsers install before executing tests
- **References:**
  - https://github.com/democratizedspace/dspace/actions/runs/18586257662/job/52990714065
  - https://github.com/democratizedspace/dspace/actions/runs/18586257662/job/52990714057
