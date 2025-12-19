# 2025-08-14-duration-string-undefined

- **Date:** 2025-08-14
- **Component:** frontend
- **Root cause:** getDurationString showed 'undefined' when remaining time was absent
- **Resolution:** skip appending remaining time when it is missing
- **References:**
  - frontend/src/utils/strings.js
  - tests/strings.test.ts
