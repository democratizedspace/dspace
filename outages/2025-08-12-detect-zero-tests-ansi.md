# 2025-08-12-detect-zero-tests-ansi

- **Date:** 2025-08-12
- **Component:** test harness
- **Root cause:** ANSI color codes in vitest output prevented zero-test detection
- **Resolution:** strip ANSI escape sequences before checking test output
- **References:**
  - DEVELOPER_GUIDE.md#run-unit-tests
  - scripts/utils/detect-zero-tests.js
