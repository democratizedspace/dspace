# v3 production cutover readiness: service worker behavior for v2.1 users

Date: 2026-03-25  
Owners: QA + web platform

## TL;DR

Yes — we have concrete evidence that the v3 rollout path can refresh correctly without asking users
for a hard refresh, and the implementation has explicit safeguards for stale-asset scenarios.

Two important realities for cutover planning:

1. **Current production (`https://democratized.space`) is not serving a service worker script at
   `/service-worker.js` today** (it returns HTML/404 content).
2. **v3 (`https://staging.democratized.space`) is serving a versioned service worker with
   skip-waiting + controller-change reload logic + network-first HTML caching.**

Because current prod does not appear to have an active service worker at the v3 registration path,
most v2.1 users should behave like **first-time service-worker installs** after cutover. On first
load after deploy they receive v3 HTML/assets from network; on subsequent navigations/refreshes the
v3 worker controls the page.

## Live environment evidence (captured 2026-03-25)

### 1) Current prod does not expose a worker at `/service-worker.js`

```bash
curl -fsSL https://democratized.space/service-worker.js | sed -n '1,40p'
```

Observed result: HTML document for a not-found page (not JavaScript worker source).

### 2) Staging serves a real, versioned worker

```bash
curl -fsSL https://staging.democratized.space/service-worker.js | sed -n '1,80p'
```

Observed result includes:

- `const SW_CACHE_VERSION = '2025-02-15';`
- versioned cache namespaces (`dspace-precache-v*`, `dspace-runtime-v*`, `dspace-pages-v*`)
- `SKIP_WAITING` message handling and activate-time `clients.claim()` behavior.

### 3) Current code path that forces update takeover + refresh

`frontend/public/scripts/offlineWorkerRegistration.js`:

- registers `/service-worker.js`
- listens for `registration.waiting` and installing->installed transitions
- posts `{ type: 'SKIP_WAITING' }`
- reloads on `controllerchange`
- performs stylesheet 404 recovery reload (single attempt)
- now also requests an **immediate `registration.update()` check** after registration (added for
  cutover confidence).

## What happens for a browser that last used v2.1

### Expected steady-state path at cutover

1. User loads `https://democratized.space` after v3 deploy.
2. Browser receives v3 HTML + hashed assets from network.
3. On `window.load`, v3 registration script runs and registers `/service-worker.js`.
4. Worker installs with resilient precache and config prewarm.
5. Activation cleanup preserves only intended cache versions; navigation cache keeps only current
   version.
6. On future updates, waiting worker is instructed to skip waiting and page reloads automatically
   when controller changes.

### Why hard refresh should not be required

- Navigation requests use **network-first** with `cache: 'no-store'` in the worker.
- Worker + HTML-related endpoints are served with no-store/no-cache headers in middleware.
- Runtime asset caching excludes HTML by content-type guard.
- Update flow forces immediate takeover via `SKIP_WAITING` and reload hooks.

## Existing automated evidence already in repo

- `frontend/e2e/service-worker-update.spec.ts`
  - registration success
  - coordinated worker updates
  - no CSS/JS 404s during update
  - recovery when old hashed asset URLs are removed
- `tests/navigationCacheHygiene.test.ts`
  - navigation cache cleanup keeps only current version
- `tests/serviceWorkerInstallResilience.test.ts`
  - install path does not fail hard on individual precache failures

## New cutover hardening included in this change

### Code hardening

- Added immediate update check right after successful registration:
  - `frontend/public/scripts/offlineWorkerRegistration.js`
  - calls `registration.update()` when available and logs warning on failure.

This reduces dependence on browser update polling intervals and tightens post-cutover convergence.

### New/expanded tests

- `tests/serviceWorkerIntegration.test.ts`
  - verifies the registration module includes an immediate `registration.update()` check.
- `tests/middlewareRuntimeEndpoints.test.ts`
  - verifies `/service-worker.js` is forced to `Cache-Control: no-cache, no-store,
    must-revalidate`
  - verifies `/cache-version.js` and HTML responses are forced to `Cache-Control: no-store`

## Remaining operational checklist for prod cutover

1. Deploy v3.
2. Purge CDN for at least:
   - `/service-worker.js`
   - `/cache-version.js`
   - `/config.json`
   - `/` and key shell routes if cached at edge
3. Validate in browser (normal refresh only):
   - open DevTools > Application > Service Workers
   - confirm active worker script is `/service-worker.js`
   - refresh once and verify no stale CSS/JS 404s
4. Validate endpoint headers:
   - `curl -I https://democratized.space/service-worker.js`
   - `curl -I https://democratized.space/cache-version.js`
   - `curl -I https://democratized.space/config.json`

## Risk callout

If any historic worker had been registered at `/` with a different script path, browser scope rules
still allow replacement by a new registration at the same scope, but behavior can vary by update
timing and client state. The immediate `registration.update()` call narrows this risk window.
