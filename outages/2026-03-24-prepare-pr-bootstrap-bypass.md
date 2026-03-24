# Outage: pre-PR scripts bypassed shared Playwright bootstrap protections

- **Date:** 2026-03-24
- **Component:** frontend/pre-pr-automation
- **Status:** Resolved

## Root cause

`frontend/scripts/prepare-pr.sh` and `frontend/scripts/prepare-pr.ps1` invoked
Playwright installation via the raw CLI path (`node .../cli.js install`).
That bypassed the shared bootstrap helper (`ensure-playwright-browsers.js`), including
proxy sanitization and Linux system-dependency install handling used by the E2E bootstrap path.

## Resolution

- Updated both prepare scripts to invoke `scripts/utils/ensure-playwright-browsers.js`.
- Added a direct execution path in the helper so scripts can run it via `node`.
- Added regression tests that assert prepare scripts call the shared helper and keep
  root-test sequencing intact.
