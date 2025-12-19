# 2025-08-14-jest-config-missing

- **Date:** 2025-08-14
- **Component:** frontend tests
- **Root cause:** E2E coverage check failed because frontend/package.json lacked a Jest testMatch pattern.
- **Resolution:** Added Jest testMatch configuration so coverage checks find all Jest test files.
- **References:**
  - e2e/test-coverage.spec.ts
