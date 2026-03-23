# Grouped E2E runner executed remote harness groups by default (2026-03-23)

- **Summary**: `frontend/scripts/run-test-groups.mjs` scheduled remote harness suites in every local
  grouped run, even when remote-mode env flags were not set.
- **Impact**: Default grouped runs spent time in remote-only suites and increased failure noise in
  local pre-PR automation.

## Root cause

1. Remote suites were defined in `TEST_GROUPS` and always iterated in `main()`.
2. The suites self-skipped in-spec unless env flags were set, but still incurred runner startup,
   browser provisioning checks, and webServer overhead.

## Resolution

- Added explicit group filtering in `main()`:
  - `Remote Release Smoke` runs only when `REMOTE_SMOKE=1`.
  - `Remote Legacy Migration` runs only when `REMOTE_MIGRATION=1`.
  - `Remote Completionist Award III` runs only when `REMOTE_COMPLETIONIST_AWARD_III=1`.
- Added a regression test asserting that remote-group env gating remains present.

## Prevention

- Keep remote harnesses opt-in at orchestration level rather than relying solely on in-spec skips.
