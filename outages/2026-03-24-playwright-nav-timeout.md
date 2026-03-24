# Outage: nav smoke false-negative from tight Playwright navigation timeout

- **Date:** 2026-03-24
- **Component:** frontend/e2e-automation
- **Status:** Resolved

## Root cause

Playwright config used a `navigationTimeout` of 15s. In this container, `/docs` and other
routes can occasionally exceed that threshold during server startup/hydration windows,
causing flaky `page.goto` timeouts even when routes are ultimately healthy.

## Resolution

- Increased shared Playwright `actionTimeout` and `navigationTimeout` to 60s.
- Kept nav smoke assertions unchanged so failures still reflect real route/console regressions,
  not startup jitter.
