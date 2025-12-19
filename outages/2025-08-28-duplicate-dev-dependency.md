# duplicate-dev-dependency

- **Date:** 2025-08-28
- **Component:** frontend package
- **Root cause:** `frontend/package.json` listed `@astrojs/node` twice in devDependencies, which broke new uniqueness checks.
- **Resolution:** Removed the duplicate entry and added a test ensuring devDependency keys are unique.
- **References:**
  - frontend/package.json
  - tests/packageManager.test.ts
