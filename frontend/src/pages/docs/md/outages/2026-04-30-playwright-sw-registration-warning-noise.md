---
title: 'Playwright service worker registration warning noise (2026-04-30)'
slug: '2026-04-30-playwright-sw-registration-warning-noise'
summary: 'Filtered expected Playwright-only service worker block warnings from E2E console logging while preserving service worker behavior checks.'
---

# Playwright service worker registration warning noise (2026-04-30)

- **Symptom**: `npm run test:e2e:groups` emitted repeated `[console.warning] Service Worker registration blocked by Playwright` lines in otherwise passing groups.
- **Root cause**:
    - Some E2E suites attach `page.on('console', ...)` handlers that print browser warnings to test output.
    - Playwright intentionally blocks service workers in default contexts, and the app surfaces that expected block condition.
    - The exact expected warning message was being forwarded verbatim into group logs as noise.
- **Fix**:
    - Added a narrow helper to identify the exact expected warning text: `Service Worker registration blocked by Playwright`.
    - Updated E2E console forwarding to suppress only that exact warning while preserving all other console warnings/errors.
    - Kept explicit service worker coverage unchanged, including tests that allow service workers and verify registration/update behavior.
- **Verification commands**:
    - `rg "Service Worker registration blocked by Playwright"`
    - `npm run test:e2e:groups`
    - `npm test`
    - `npm run lint; npm run type-check; npm run build; npm test; node scripts/link-check.mjs`
- **Why warning-only**:
    - The warning reflects Playwright test-environment configuration rather than a runtime production failure.
    - Functional E2E assertions were passing; only console output signal-to-noise was degraded.
