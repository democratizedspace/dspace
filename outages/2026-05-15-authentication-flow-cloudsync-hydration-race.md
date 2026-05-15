# Outage: Authentication-flow E2E cloud-sync hydration race

- **Date**: 2026-05-15
- **Severity**: medium
- **Component**: `frontend/e2e/authentication-flow.spec.ts`
- **Incident ID**: `2026-05-15-authentication-flow-cloudsync-hydration-race`

## Symptom

The local pre-PR validation sequence failed during the grouped Structure Tests run:

- `npm run lint; npm run type-check; npm run build; npm test; node scripts/link-check.mjs`

The failing test was `frontend/e2e/authentication-flow.spec.ts`. Playwright timed out waiting for `getByTestId('sync-success')` to contain `Token saved and validated` after clicking Save on `/cloudsync`.

## Root cause

`authentication-flow.spec.ts` called the generic `waitForHydration(page)` helper before interacting with the cloud-sync form. Without a target, that helper only requires some node on the page to have `data-hydrated="true"`; on `/cloudsync`, the shared layout or menu can satisfy that condition before `Syncer.svelte` finishes its own mount sequence.

When the Structure Tests group ran in parallel, the test could click the server-rendered Save button before `Syncer.svelte` had completed mounting, loaded local token state, set `data-hydrated="true"` on `data-testid="cloud-sync-form"`, and exposed `window.__cloudSyncReady`. That early click had no hydrated `saveToken` handler to run, so the token was never validated, saved, or announced, and the `sync-success` status node never appeared.

## Fix

The authentication-flow E2E now waits specifically for the cloud-sync form to report `data-hydrated="true"` and for `window.__cloudSyncReady` before clicking Save. The same targeted readiness wait runs after reload before asserting that the token persisted back into the field.

This keeps coverage for saving, validating, persisting, and clearing the token while removing the hydration race that made the success status unobservable.

## Verification commands

- `npm --prefix frontend run test:e2e -- authentication-flow.spec.ts`
- `npm run test:root -- tests/outagesConventions.test.ts tests/docsPromptsOutages.test.ts`
- `npm test`
- `npm run lint`
- `npm run type-check`
- `npm run build`
- `node scripts/link-check.mjs`
- `npm run lint; npm run type-check; npm run build; npm test; node scripts/link-check.mjs`
