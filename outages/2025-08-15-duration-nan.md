# duration-nan

- **Date:** 2025-08-15
- **Component:** frontend
- **Root cause:** getDuration returned 'NaN%' when provided non-numeric values
- **Resolution:** sanitize duration and default to 0.00% for invalid numbers
- **References:**
  - frontend/src/utils/strings.js
  - tests/strings.test.ts
  - frontend/README.md
