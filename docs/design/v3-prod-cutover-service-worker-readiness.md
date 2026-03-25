# v3 Production Cutover Readiness: Service Worker + Browser Refresh Behavior

_Date: March 25, 2026_

## Goal

Confirm what users will experience when `https://democratized.space` is cut over from v2.1 to v3,
with specific focus on page refresh behavior and service worker correctness (no hard-refresh + cache-clear
requirement).

## Executive summary

- v3 has the required technical pieces to self-heal stale app-shell issues after deployment:
  versioned service-worker cache names, navigation cache cleanup, and update-triggered reload logic.
- We added one additional safeguard for cutover: service worker registration now uses
  `updateViaCache: 'none'` and performs an immediate `registration.update()` check on page load, reducing
  the chance that HTTP cache delays a worker update check.
- We also added/extended automated tests around bootstrap cache headers and update-check behavior.

## Evidence collected (March 25, 2026)

### 1) Current prod (`democratized.space`) is still v2.1 behavior

Direct HTTP checks show that:

- `https://democratized.space/service-worker.js` returns HTML (`content-type: text/html`), not JavaScript.
- `https://democratized.space/scripts/offlineWorkerRegistration.js` also returns HTML.
- `https://democratized.space/cache-version.js` also returns HTML.

Interpretation: current prod is not serving the v3 service-worker bootstrap assets yet, which matches the
expected pre-cutover state.

### 2) Current staging (`staging.democratized.space`) is serving v3 service worker assets correctly

Direct HTTP checks show that:

- `https://staging.democratized.space/service-worker.js` returns JavaScript and embeds
  `SW_CACHE_VERSION = '2025-02-15'`.
- `https://staging.democratized.space/scripts/offlineWorkerRegistration.js` returns JavaScript.
- `https://staging.democratized.space/cache-version.js` returns JavaScript.

Interpretation: staging has the v3 cutover path active and can be used as the behavior baseline for prod.

## Expected browser behavior during v2.1 → v3 cutover

### Users with no active v2.1 service worker (likely current prod reality)

1. First load after cutover downloads v3 HTML and registration script.
2. Registration script registers `/service-worker.js`.
3. New worker installs in background; current page may remain uncontrolled until next navigation/reload.
4. On the next refresh/navigation, worker controls the page and serves the new cache model.

This should not require manual cache clearing.

### Users who somehow have an older worker or stale caches

- v3 update path posts `SKIP_WAITING`, then reloads page on `controllerchange` (plus a short fallback
  timeout-driven reload).
- Worker activation deletes old navigation caches so stale HTML referencing removed hashed assets is not
  reused.
- Runtime/precache retain a small version history (`MAX_CACHE_HISTORY = 2`) to smooth asset transitions.
- `/config.json` remains network-first (`no-store`) while still being warmed for offline fallback.

## Changes implemented for cutover hardening

1. **Force update checks to bypass HTTP cache for SW scripts/imports**
   - Register worker with `{ updateViaCache: 'none' }`.
2. **Trigger immediate update check on load after registration**
   - Call `registration.update()` and log warning on failure.
3. **Extend automated coverage**
   - Assert registration options + update call in offline worker registration tests.
   - Add regression test for warning path when `registration.update()` fails.
   - Add middleware test verifying cache-control headers on `/service-worker.js` and `/cache-version.js`.

## Operational cutover checklist additions

When promoting v3 to production:

1. Deploy immutable v3 tag to prod target.
2. Purge CDN cache for at least:
   - `/service-worker.js`
   - `/cache-version.js`
   - `/scripts/offlineWorkerRegistration.js`
3. Validate on a browser profile that has prior v2.1 usage:
   - Load `/` once.
   - Perform a normal refresh (not hard refresh).
   - Confirm app remains styled/functional and no recurring `/_astro/*.css` 404 loop appears.
4. Confirm response headers:
   - `/service-worker.js` => `Cache-Control: no-cache, no-store, must-revalidate`
   - `/cache-version.js` => `Cache-Control: no-store`

## Risks and mitigations

- **Risk:** CDN stale copies of service worker bootstrap assets delay update pickup.
  - **Mitigation:** explicit CDN purge + `updateViaCache: 'none'` + immediate `registration.update()`.
- **Risk:** stale navigation HTML references removed hashed assets.
  - **Mitigation:** single-version navigation cache cleanup in `activate`.
- **Risk:** runtime config flags get pinned stale.
  - **Mitigation:** network-first `/config.json` handling and `no-store` cache policy.

## Conclusion

Based on staging behavior, code paths, and updated automated tests, v3 cutover is ready from a service
worker/browser-refresh perspective. The remaining critical success condition is operational: purge CDN
artifacts at cutover and run a real browser refresh validation against production immediately after deploy.
