# duration-out-of-range

- **Date:** 2025-08-25
- **Component:** frontend
- **Root cause:** getDuration allowed negative or over-100 values, producing invalid percentages
- **Resolution:** clamp duration values to the 0-100% range and add tests
- **References:**
  - frontend/src/utils/strings.js
  - tests/strings.test.ts
  - frontend/__tests__/strings.test.js
  - frontend/README.md
