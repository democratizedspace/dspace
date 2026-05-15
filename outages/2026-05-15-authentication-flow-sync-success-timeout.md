# Outage: Authentication flow E2E sync-success timeout

- **Date**: 2026-05-15
- **Severity**: medium
- **Component**: `frontend/e2e/authentication-flow.spec.ts` and the Cloud Sync token form
- **Incident ID**: `2026-05-15-authentication-flow-sync-success-timeout`

## Symptom

The combined local verification command could fail during `npm test`:

```bash
npm run lint; npm run type-check; npm run build; npm test; node scripts/link-check.mjs
```

The failing test was `frontend/e2e/authentication-flow.spec.ts`. Playwright timed out waiting for
`getByTestId('sync-success')` to contain `Token saved and validated`:

```text
Timed out 15000ms waiting for expect(locator).toHaveText(expected)
Locator: getByTestId('sync-success')
Expected pattern: /Token saved and validated/i
Received: <element(s) not found>
```

The failure appeared in the grouped Structure Tests run where `authentication-flow.spec.ts` runs in
parallel with other structure and smoke specs.

## Root cause

The E2E spec used the generic hydration helper for `/cloudsync`. That helper can return after any
hydrated node on the page is ready, not necessarily after the Cloud Sync `Syncer` component has
finished its own startup work.

`Syncer` loaded the saved GitHub token asynchronously in `onMount`, but the Save action was enabled
while that startup work was still pending. In a busy grouped Playwright run, the test could fill the
GitHub token field and click Save while the component was still initializing. Startup state could
then race the typed token, so the test did not reliably observe the production success status.

## Fix

- Keep Cloud Sync token actions disabled until component initialization completes.
- Preserve a token typed during startup instead of overwriting it with the late-loaded saved token.
- Reset `window.__cloudSyncReady` on Cloud Sync mount/unmount so reloads and remounts observe the
  newly loaded page state instead of a stale previous readiness value.
- Mark `data-hydrated="true"` and `window.__cloudSyncReady` only after Cloud Sync token startup
  work completes, and finalize readiness in the startup cleanup path so storage failures do not leave
  the form permanently disabled.
- Start saved-token backup refresh after readiness is marked so a slow backup listing does not block
  token actions.
- Update `authentication-flow.spec.ts` to wait for the Cloud Sync form's own hydration/readiness
  sentinel and click `data-testid="save-token"`.
- Add focused component regression coverage for typing a token during startup and saving it after
  initialization.

## Verification commands

- `npm run test:root -- frontend/src/pages/cloudsync/__tests__/Syncer.spec.ts tests/outagesConventions.test.ts tests/docsPromptsOutages.test.ts`
- `npm run test:root -- frontend/src/pages/cloudsync/__tests__/Syncer.spec.ts`
- `npm --prefix frontend run test:e2e -- authentication-flow.spec.ts`
- `npm test`
- `npm run lint`
- `npm run type-check`
- `npm run build`
- `node scripts/link-check.mjs`
