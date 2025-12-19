# ensure-playwright-path-assumptions

- **Date:** 2025-12-12
- **Component:** tests:playwright-bootstrap
- **Root cause:** ensurePlaywrightBrowsers unit tests hard-coded Linux-style cache and repo paths, causing path mismatches and missing CLI errors on Windows runs of npm run test:root.
- **Resolution:** Normalized expectations with path.join, skipped the Linux-specific install flow on Windows, and reused the repository cwd helper so assertions adapt to each OS.
- **References:**
  - scripts/tests/ensurePlaywrightBrowsers.test.ts
  - frontend/scripts/utils/ensure-playwright-browsers.js
