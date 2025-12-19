# list-missing-images-whitespace

- **Date:** 2025-08-25
- **Component:** scripts
- **Root cause:** listMissingImages treated paths with surrounding spaces as missing files
- **Resolution:** trimmed image paths before checking existence
- **References:**
  - scripts/utils/fs-checks.js
  - scripts/tests/fsChecks.test.ts
  - docs/prompts/codex/ci-fix.md
