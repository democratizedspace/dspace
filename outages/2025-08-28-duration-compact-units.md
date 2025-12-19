# duration-compact-units

- **Date:** 2025-08-28
- **Component:** frontend
- **Root cause:** duration parser ignored values when time units lacked spaces
- **Resolution:** parse duration components with regex to allow compact strings
- **References:**
  - frontend/src/utils.js
  - frontend/tests/duration.test.ts
  - frontend/src/pages/docs/md/processes.md
  - frontend/src/pages/docs/md/process-guidelines.md
