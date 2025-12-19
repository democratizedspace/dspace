# prepare-pr-recursion

- **Date:** 2025-08-28
- **Component:** pre-PR script
- **Root cause:** prepare-pr scripts invoked "npm test", which called run-tests.js recursively and caused "npm run test:ci" to hang
- **Resolution:** Run root tests directly with "npm run test:root" and allow skipping via SKIP_UNIT_TESTS to avoid recursion
- **References:**
  - frontend/scripts/prepare-pr.sh
  - frontend/scripts/prepare-pr.ps1
  - run-tests.js
  - scripts/tests/preparePrScripts.test.ts
