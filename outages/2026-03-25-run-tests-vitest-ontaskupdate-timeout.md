# Outage: `node run-tests.js` failed on transient Vitest worker RPC timeout

- **Date:** 2026-03-25
- **Component:** root test harness (`run-tests.js` / `npm run test:root`)
- **Status:** Resolved

## Root cause

The one-command harness failed even when all test files passed because Vitest intermittently ended with
an unhandled worker RPC timeout (`[vitest-worker]: Timeout calling "onTaskUpdate"`).
This happened after long runs in this container and caused `npm run test:root` to exit non-zero, which
left QA checklist §2.1 “One command” automation unchecked.

## Resolution

- Added a targeted retry in `run-tests.js` for this specific transient timeout signature.
- The harness now retries `npm run test:root` once, then proceeds normally when retry succeeds.
- Added regression coverage to ensure the retry path is exercised and future regressions are caught.
