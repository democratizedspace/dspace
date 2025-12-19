# offline-toast-src-path

- **Date:** 2025-12-12
- **Component:** frontend:build
- **Root cause:** The Layout inline script drifted back to an unbundled /src/scripts import, letting /src/scripts/offlineToast.js leak into the 404 server chunk and failing build-output validation on Windows.
- **Resolution:** Centralized the offline toast path via OFFLINE_TOAST_PUBLIC_PATH, updated Layout.astro to use the shared /scripts/offlineToast.js public URL, refreshed the offline-first runbook, and revalidated the build output to remove all /src/scripts references.
- **References:**
  - frontend/public/scripts/offlineToast.js
  - frontend/src/layouts/Layout.astro
  - frontend/src/utils/offlineToastPath.ts
  - docs/ops/offline-first.md
  - tests/buildOutputValidation.test.ts
