# Authentication flow sync-success timeout in grouped E2E runs

## Symptom

The full local verification sequence:

`npm run lint; npm run type-check; npm run build; npm test; node scripts/link-check.mjs`

failed during the grouped Playwright E2E phase. The failing test was
`frontend/e2e/authentication-flow.spec.ts`.

Playwright timed out waiting for `getByTestId('sync-success')` to contain
`Token saved and validated`; the locator was not found before the 15 second assertion timeout.

## Root cause

The test navigated to `/cloudsync` and called the generic `waitForHydration(page)` helper before
clicking Save. That helper intentionally returns when any hydrated island on the page reports
`data-hydrated="true"`.

In the parallel Structure Tests group, that was not specific enough for the Cloud Sync form. The
test could fill the server-rendered token field and click the server-rendered Save button before the
Cloud Sync Svelte component had attached its client-side click handler. When that happened, the
validation mock was never exercised, the token was never saved, and the success status element was
never rendered.

## Fix

- Wait for the Cloud Sync form's own `data-testid="cloud-sync-form"` hydration marker.
- Wait for the page-level `window.__cloudSyncReady` readiness flag that the Cloud Sync component sets
  after completing its mount work.
- Click the stable `data-testid="save-token"` control instead of a generic role/name lookup.
- Preserve the existing assertions that validate the token, persist it, reload it from storage, and
  clear it.

## Verification commands

- `npm --prefix frontend run test:e2e -- authentication-flow.spec.ts`
- `npm run test:root -- tests/outagesConventions.test.ts tests/docsPromptsOutages.test.ts`
- `npm test`
- `npm run lint`
- `npm run type-check`
- `npm run build`
- `node scripts/link-check.mjs`
