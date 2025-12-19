# eslint-plugin-missing

- **Date:** 2025-08-25
- **Component:** frontend lint
- **Root cause:** ESLint failed to load @typescript-eslint plugins because frontend dev dependencies were not installed.
- **Resolution:** Install frontend packages before running lint to provide @typescript-eslint plugins.
- **References:**
  - frontend/package.json
  - tests/eslintPluginPresence.test.ts
