# backup-tar-windows-path

- **Date:** 2025-12-12
- **Component:** scripts/backup
- **Root cause:** The backup script invoked tar with absolute Windows paths containing drive letters, which tar interpreted as remote hosts (e.g., C:), causing archive creation to fail on Windows while succeeding on Linux.
- **Resolution:** Reworked scripts/backup.mjs to run tar from the repo root with relative paths via execFileSync and ensured output directories are created recursively before archiving.
- **References:**
  - scripts/backup.mjs
  - tests/backupScript.test.ts
