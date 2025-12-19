# duration-infinity

- **Date:** 2025-08-28
- **Component:** frontend
- **Root cause:** sanitizeDuration returned 0 for Infinity causing progress to show 0%
- **Resolution:** treat infinite durations as 100% in sanitizeDuration
- **References:**
  - frontend/src/utils/strings.js
  - tests/strings.test.ts
  - frontend/__tests__/strings.test.js
  - frontend/README.md
