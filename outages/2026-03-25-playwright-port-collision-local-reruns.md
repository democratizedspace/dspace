# Playwright local reruns collided on static preview port 4173

## Summary
Playwright used a fixed default preview port (`4173`) for all non-CI runs. In container/local reruns,
stale preview processes could keep that port occupied, causing `EADDRINUSE` failures before tests
started.

## User-visible impact
- E2E reruns failed with `listen EADDRINUSE` despite healthy test code.
- QA progress became brittle when prior failed runs left background preview processes behind.

## Regression window
- **Introduced:** fixed default port behavior in Playwright config.
- **Detected:** 2026-03-25 while repeatedly running v3 checklist Playwright suites.
- **Fixed:** 2026-03-25.

## Root cause
Local/non-CI runs shared one static port regardless of process lifecycle. Orphaned preview processes
from earlier runs blocked subsequent invocations.

## Resolution
- In `frontend/playwright.config.ts`, kept CI on deterministic port `4173`.
- For non-CI runs, default port now derives from process ID (`4173 + process.pid % 1000`) unless
  `PLAYWRIGHT_PORT` is explicitly set.
- This preserves CI determinism while preventing local rerun collisions.
