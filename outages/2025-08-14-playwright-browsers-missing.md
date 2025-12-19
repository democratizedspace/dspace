# 2025-08-14-playwright-browsers-missing

- **Date:** 2025-08-14
- **Component:** tests
- **Root cause:** Playwright browsers were absent, causing grouped E2E tests to fail
- **Resolution:** Install Playwright browsers with system dependencies before running tests
- **References:**
  - docs/prompts/codex/ci-fix.md#lessons-learned
