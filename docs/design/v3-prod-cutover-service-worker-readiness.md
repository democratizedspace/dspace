# v3 Production Cutover Readiness: Service Worker Migration from v2.1

Date: 2026-03-25

## Why this matters

For v3 cutover we need confidence that users coming from current production (`v2.1`) can refresh normally and land on a healthy v3 app without requiring a hard-refresh/cache clear.

## Direct evidence collected

### 1) Current production (`https://democratized.space`) does not currently serve a service worker script

- `GET /service-worker.js` returns an HTML 404 page payload, not JavaScript.
- This means there is no active v2.1 service worker script at that URL that could control future navigations post-cutover.

Validation command used:

```bash
curl -sSL https://democratized.space/service-worker.js | sed -n '1,60p'
```

Observed output begins with `<!DOCTYPE html>` and renders a 404 page.

### 2) Staging (`https://staging.democratized.space`) does serve the v3 service worker

- `GET /service-worker.js` returns valid JS service worker source.
- `GET /scripts/offlineWorkerRegistration.js` returns the registration module used by layout.

Validation commands used:

```bash
curl -sSL https://staging.democratized.space/service-worker.js | sed -n '1,80p'
curl -sSI https://staging.democratized.space/service-worker.js
curl -sSI https://staging.democratized.space/scripts/offlineWorkerRegistration.js
```

## What will happen to v2.1 users at cutover

Given the evidence above, users on current prod are not carrying a live `/service-worker.js` controller from v2.1 at that path. At cutover:

1. User refreshes/loads `https://democratized.space`.
2. Browser receives v3 HTML + JS assets (subject to CDN/browser cache policy).
3. v3 layout executes `/scripts/offlineWorkerRegistration.js`.
4. Browser registers `/service-worker.js` for the first time on production origin.
5. New service worker installs and activates using current v3 lifecycle logic.
6. Subsequent navigations/assets are managed by v3 service worker strategy.

This is materially safer than an in-place migration between two incompatible active workers, because v2.1 is not currently controlling clients through `/service-worker.js`.

## Key v3 service-worker behaviors relevant to cutover safety

- Navigation requests are network-first with offline fallback (reduces stale shell risk during online cutover).
- `config.json` is fetched with `cache: 'no-store'` and runtime-cached as fallback (supports offline resilience without pinning stale flags).
- Activation keeps bounded cache history and removes old navigation caches.
- Install precache is resilient to individual asset 404/fetch failures.

## Fix implemented for cutover/update robustness

### Problem

`navigator.serviceWorker.register('/service-worker.js')` can still be affected by HTTP caching behavior during update checks in some browser/cache combinations.

### Change

Updated registration to:

```js
navigator.serviceWorker.register('/service-worker.js', { updateViaCache: 'none' })
```

And explicitly triggers `registration.update()` after successful registration.

### Why this helps

- `updateViaCache: 'none'` ensures service worker script update checks bypass HTTP cache.
- Explicit `registration.update()` makes update checks deterministic on page load.
- Together these reduce risk of stale worker script lingering through CDN/browser cache windows.

## Automated coverage added/updated

- Updated `frontend/__tests__/offlineWorkerRegistration.test.js` to assert registration uses `updateViaCache: 'none'`.
- Added a test case verifying warning path when explicit `registration.update()` fails.

## Cutover readiness conclusion

Based on current production evidence and v3 behavior/fixes above, we have concrete evidence that a normal refresh path should work for v2.1 users during v3 cutover, without requiring hard refresh/cache clearing in the expected online case.

## Residual risks and mitigations

- **Residual risk:** CDN/browser HTML cache can still serve older HTML briefly depending on edge state.
  - **Mitigation:** keep deploy cache purge/header policy aligned with release runbook.
- **Residual risk:** first registration can fail for transient network/user-agent issues.
  - **Mitigation:** registration already logs warning and app remains usable online without SW.

## Suggested production verification checklist (post-cutover)

1. Open prod in clean profile; confirm `/service-worker.js` is JS and registration succeeds.
2. Refresh once; confirm page styled and route navigation works.
3. Confirm `/config.json` reflects production flags.
4. Simulate offline after one successful load; confirm app boot fallback works.
5. Confirm no widespread console errors in first-hour monitoring.
