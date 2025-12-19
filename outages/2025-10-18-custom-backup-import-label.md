# 2025-10-18-custom-backup-import-label

- **Date:** 2025-10-18
- **Component:** frontend/contentbackup
- **Root cause:** The custom content import textarea lost its accessible label, so Playwright could not locate it and assistive technology users could not trigger imports.
- **Resolution:** Restored an accessible name on the textarea and added focused tests to ensure the importer remains discoverable and wired to the import helper.
- **References:**
  - frontend/e2e/custom-backup.spec.ts
  - frontend/src/pages/contentbackup/svelte/Importer.svelte
  - tests/customContentBackupImporterAccessibility.test.ts
