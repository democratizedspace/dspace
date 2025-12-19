# 2025-08-14-frontend-no-tests

- **Date:** 2025-08-14
- **Component:** test
- **Root cause:** frontend's npm test script executed without any unit tests, masking failures
- **Resolution:** added a trivial frontend vitest to ensure the test harness runs
- **References:**
  - frontend/tests/sanity.test.ts
