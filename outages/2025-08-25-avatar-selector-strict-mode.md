# avatar-selector-strict-mode

- **Date:** 2025-08-25
- **Component:** e2e tests
- **Root cause:** profile-avatar-selection.spec.ts used a non-unique button selector matching multiple elements, causing Playwright strict mode violation
- **Resolution:** use an exact `getByRole` match for the intended avatar button
- **References:**
  - frontend/e2e/profile-avatar-selection.spec.ts
