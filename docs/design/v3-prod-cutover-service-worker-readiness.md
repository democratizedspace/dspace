# v3 prod cutover readiness: service worker behavior for v2.1 users

## Why this document exists

Before cutting over `https://democratized.space` from v2.1 to v3, we need high confidence that a
normal browser refresh is enough for existing users. The risk is stale cache and stale worker state
causing broken CSS/JS loads or requiring a hard refresh.

This document captures:

1. What we observed on prod vs staging on **March 25, 2026**.
2. What the v3 service worker does during updates.
3. The v2.1 → v3 transition risks.
4. Code/test changes that reduce cutover risk.
5. An operator validation checklist for launch day.

## Snapshot evidence (March 25, 2026)

### Live endpoint behavior

Using direct `curl` checks:

- `https://democratized.space/service-worker.js` returned **HTML**, not JavaScript.
- `https://democratized.space/scripts/offlineWorkerRegistration.js` returned **HTML**, not
  JavaScript.
- `https://democratized.space/config.json` returned **HTML**, not JSON.
- `https://staging.democratized.space/service-worker.js` returned
  `application/javascript` with v3 worker code.
- `https://staging.democratized.space/scripts/offlineWorkerRegistration.js` returned
  `application/javascript`.
- `https://staging.democratized.space/config.json` returned JSON with
  `{"offlineWorker":{"enabled":true}, ...}`.

Interpretation: current prod (v2.1) does not expose the v3 runtime/SW endpoints yet, while staging
already does.

## v3 service worker update model (current)

The v3 worker is versioned (`SW_CACHE_VERSION`) and uses:

- versioned precache/runtime/navigation cache keys,
- network-first for HTML navigation,
- cache-first for static hashed assets (`/_astro/*.css`, `/_astro/*.js`),
- `SKIP_WAITING` + controller-change reload flow so clients move to new worker promptly,
- activate-time cache cleanup by version.

This is the right general strategy to avoid stale-shell failures after deploy.

## Specific cutover risk from v2.1 browser caches

A user who recently visited v2.1 may already have cached responses at SW-related URLs under the
apex host.

If `/service-worker.js` was previously cached as HTML at the browser/CDN layer, first-time v3
registration can request that stale cached HTML and fail with MIME mismatch (HTML instead of JS).
The app can still load, but worker installation/update behavior becomes inconsistent until cache
expires or user hard-refreshes.

## Fix implemented for cutover safety

### Cache-versioned SW registration URL

The registration script now resolves the SW URL as:

- `/service-worker.js?v=<cacheVersion>` when cache version is known,
- `/service-worker.js` as fallback.

`cacheVersion` is read from `self.CACHE_VERSION` first, then localStorage
(`dspace-cache-version`).

Why this helps:

- It bypasses stale cached v2.1 responses keyed to the bare `/service-worker.js` URL.
- It ensures the first v3 registration request is strongly tied to the active build version.
- It preserves the existing SW scope (`/`) because query params do not narrow scope.

## Automated coverage added/updated

- Updated integration assertion to expect registration through `resolveServiceWorkerUrl()`.
- Added unit test proving registration uses `/service-worker.js?v=<cacheVersion>` when available.

This complements existing E2E coverage that already validates update coordination, skip-waiting,
and CSS/JS accessibility during worker version changes.

## Expected user experience after cutover

For a typical v2.1 user opening or refreshing `https://democratized.space` after v3 deploy:

1. HTML is loaded from v3 origin.
2. Registration script computes a versioned SW URL.
3. Browser requests `/service-worker.js?v=<version>` and installs v3 worker.
4. On subsequent refresh/navigation, v3 caching strategy applies.
5. On future deploys, worker update flow triggers `SKIP_WAITING` and reloads to the new controller.

Net: no hard refresh should be required for the normal transition path.

## Launch-day validation checklist

1. Verify content types after deploy on apex:
   - `/service-worker.js` => JavaScript
   - `/scripts/offlineWorkerRegistration.js` => JavaScript
   - `/config.json` => JSON
2. In browser DevTools (Application tab):
   - SW is active and controlling client.
   - Cache Storage contains current `dspace-*-v<version>` keys.
3. Reload once and confirm:
   - no 404 for `/_astro/*.css|js`,
   - app styles load correctly,
   - no persistent `Service worker registration failed` warnings.
4. Trigger a synthetic SW update on staging/prod canary and verify one reload promotes the new
   controller.

## Remaining operational cautions

- CDN/browser caches can still mask issues if content-type routing is misconfigured at the edge.
- Keep `/service-worker.js` revalidation aggressive and purge CDN on deploy for SW/config routes.
- If rollback is required, follow the existing offline-first rollback runbook.
