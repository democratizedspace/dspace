# duration-uppercase-units

- **Date:** 2025-08-25
- **Component:** frontend
- **Root cause:** duration parser rejected uppercase time units
- **Resolution:** normalize unit identifiers to lowercase before converting
- **References:**
  - frontend/src/utils.js
  - frontend/tests/duration.test.ts
  - frontend/src/pages/docs/md/processes.md
  - frontend/src/pages/docs/md/process-guidelines.md
