# Outage: Playwright service worker block warning log noise in E2E console capture

- **Date**: 2026-04-30
- **Severity**: low
- **Component**: `frontend/e2e/*` console listeners
- **Incident ID**: `2026-04-30-playwright-service-worker-warning-filter`

## Symptom

Grouped Playwright E2E runs printed repeated `[console.warning] Service Worker registration blocked by Playwright` lines even when suites passed.

## Root cause

Multiple E2E specs attach broad `page.on('console')` logging handlers that echo browser warnings into the runner logs. In Playwright contexts where service workers are intentionally blocked, this expected warning was repeatedly surfaced as noise.

## Fix

Add a narrow, exact-string filter in affected E2E console handlers to skip only:

- `message.type() === 'warning'`
- `message.text() === 'Service Worker registration blocked by Playwright'`

All other warning and error messages continue to be logged.

## Verification commands

- `rg "Service Worker registration blocked by Playwright" frontend/e2e`
- `npm --prefix frontend run test:e2e:groups`
- `npm test`

## Why this was warning-only

This did not break application behavior or test assertions. It only increased log noise for an expected Playwright/service-worker interaction, reducing signal quality in CI and local QA output.
