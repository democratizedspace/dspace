# Outage: Playwright service-worker registration warning noise in E2E logs

- **Date**: 2026-04-30
- **Severity**: low
- **Component**: `frontend/e2e/*` console listeners
- **Incident ID**: `2026-04-30-playwright-service-worker-registration-warning-noise`

## Symptom

`npm run test:e2e:groups` emitted repeated `[console.warning] Service Worker registration blocked by Playwright` lines in otherwise passing suites.

## Root cause

Some E2E specs log browser console warnings verbatim for debugging. Playwright's blocked-service-worker warning is expected under `serviceWorkers: 'block'`, but those spec-local listeners did not filter this known warning.

## Fix

Added a narrow exact-string filter in affected spec console handlers to ignore only `Service Worker registration blocked by Playwright` when message type is `warning`. All other warning/error console output remains unchanged.

## Verification commands

- `rg "Service Worker registration blocked by Playwright"`
- `npm --prefix frontend run test:e2e:groups`
- `npm test`
- `npm run lint; npm run type-check; npm run build; npm test; node scripts/link-check.mjs`

## Why this was warning-only

Test behavior and assertions were already passing; the issue was log noise from expected platform behavior in Playwright, not an application failure.
