# run-tests-zero-tests-passed

- **Date:** 2025-08-14
- **Component:** test harness
- **Root cause:** run-tests.js only warned when no root tests ran, allowing CI to pass with zero tests
- **Resolution:** exit with an error when zero root tests are detected
- **References:**
  - scripts/utils/detect-zero-tests.js
  - scripts/tests/run-tests.test.ts
