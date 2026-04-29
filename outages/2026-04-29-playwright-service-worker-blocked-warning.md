# Outage: Playwright service-worker blocked warning noise

- **Date**: 2026-04-29
- **Severity**: low
- **Component**: `frontend/public/scripts/offlineWorkerRegistration.js`
- **Incident ID**: `2026-04-29-playwright-service-worker-blocked-warning`

## Symptom

Grouped Playwright E2E runs repeatedly logged `Service worker registration failed:` warnings even when tests passed and no service-worker functionality was expected in automation mode.

## Impact

QA logs contained high-volume warning noise, reducing signal-to-noise and making it harder to spot unexpected warnings/errors that need investigation.

## Root cause

Playwright E2E uses `serviceWorkers: 'block'`, which intentionally prevents `navigator.serviceWorker.register(...)` from succeeding. The offline worker registration catch-path treated this expected Playwright-specific failure like a real runtime problem and emitted `console.warn` on every run.

## Fix

Narrowly detect the expected Playwright block case only when automation is active (`navigator.webdriver === true`) and the thrown error message matches the Playwright block pattern. For that specific case, log an informational skip and return early. Keep existing warning behavior unchanged for all other service-worker registration failures.

## Verification

- `npm run lint`
- `npm run type-check`
- `npm run build`
- `npm test`
- `node scripts/link-check.mjs`
- `npm --prefix frontend run test:e2e:groups`
