# orphaned-e2e-tests

- **Date:** 2025-08-25
- **Component:** e2e tests
- **Root cause:** run-test-groups.mjs omitted nine Playwright spec files, so test-coverage.spec.ts flagged them as orphaned
- **Resolution:** include the missing specs in the Structure Tests group so coverage test passes
- **References:**
  - frontend/scripts/run-test-groups.mjs
  - frontend/e2e/test-coverage.spec.ts
