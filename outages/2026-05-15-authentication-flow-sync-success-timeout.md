# Outage: Authentication flow timed out waiting for cloud sync success

- **Date**: 2026-05-15
- **Severity**: medium
- **Component**: `frontend/e2e/authentication-flow.spec.ts` and the `/cloudsync` Svelte island
- **Incident ID**: `2026-05-15-authentication-flow-sync-success-timeout`

## Symptom

The full local validation command sequence failed during the grouped Structure Tests run:

```bash
npm run lint; npm run type-check; npm run build; npm test; node scripts/link-check.mjs
```

The failing test was `frontend/e2e/authentication-flow.spec.ts`. Playwright timed out while waiting for `getByTestId('sync-success')` to contain `Token saved and validated` after clicking Save on `/cloudsync`.

## Root cause

The `/cloudsync` Svelte island server-rendered enabled action buttons before client hydration had attached the Svelte click handlers. The authentication-flow spec waited only for generic page hydration, which could be satisfied by another hydrated node on the page.

When Structure Tests ran in parallel, the spec could fill the GitHub token field and click the pre-hydration Save button. That click was inert, so token validation never ran, no token was persisted, and the `data-testid="sync-success"` status element was never rendered.

## Fix

- Added a component-local `hydrated` flag to `Syncer.svelte`.
- Kept cloud-sync action buttons disabled until the component finishes its client-side token and gist initialization and marks `data-testid="cloud-sync-form"` as hydrated.
- Updated the authentication-flow E2E to wait for the specific cloud-sync form hydration marker before clicking Save.
- Added a focused Svelte regression test that keeps the token-loading promise pending and verifies the Save and Clear actions remain disabled until hydration finishes.

## Verification commands

- `npm --prefix frontend run test:e2e -- authentication-flow.spec.ts`
- `node frontend/node_modules/@playwright/test/cli.js test page-structure.spec.ts nav-route-smoke.spec.ts error-pages.spec.ts svelte-component-hydration.spec.ts builtin-quests.spec.ts custom-backup.spec.ts authentication-flow.spec.ts header-actions-placement.spec.ts cloud-sync.spec.ts cookie-consent.spec.ts docs-navigation.spec.ts docs-changelog.spec.ts changelog-container.spec.ts homepage-responsive-width.spec.ts failover-status.spec.ts home-page-basic.spec.ts inventory-items-bug.spec.ts indexeddb-availability.spec.ts profile-avatar-selection.spec.ts profile-page.spec.ts service-worker-update.spec.ts mobile-page-overflow.spec.ts mobile-process-form.spec.ts mobile-create-pages-overflow.spec.ts leaderboard.spec.ts settings-page.spec.ts --workers=7 --reporter=dot`
- `npm run test:root -- tests/outagesConventions.test.ts tests/docsPromptsOutages.test.ts`
- `npm test`
- `npm run lint`
- `npm run type-check`
- `npm run build`
- `node scripts/link-check.mjs`
- `npm run lint; npm run type-check; npm run build; npm test; node scripts/link-check.mjs`
