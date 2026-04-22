# Outage: Playwright deps sentinel write warning in tests

- **Date:** 2026-04-22
- **Component:** Playwright browser bootstrap helper
- **Symptom:** `scripts/tests/ensurePlaywrightBrowsers.test.ts` emitted:
  `Unable to create Playwright deps sentinel file ... ENOENT ...`

## Root cause

The sentinel write path could be exercised in tests without a guaranteed writable parent path,
which produced warning noise despite otherwise successful behavior.

## Resolution

Hardened bootstrap/test path handling so sentinel writes do not emit ENOENT warnings in expected
passing flows.

## References

- `frontend/scripts/utils/ensure-playwright-browsers.js`
- `scripts/tests/ensurePlaywrightBrowsers.test.ts`
