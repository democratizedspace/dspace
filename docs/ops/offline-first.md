# Offline-First Strategy

The DSPACE frontend must keep core gameplay reachable without a network connection. This runbook
summarises the caching model, data versioning guarantees, and recovery steps for the service worker
stack. The production worker ships from `frontend/public/service-worker.js`.
It reads the shared `CACHE_VERSION` defined in `@dspace/cache-version`, ensuring
both the app shell and worker invalidate caches in lockstep.

## Cache Responsibilities

- **Precache routes**: `/manifest.webmanifest`, `/favicon.ico`, and `/assets/logo.png` to keep
  install metadata and icons available offline. HTML documents are fetched with a strict
  network-first strategy (`cache: 'no-store'`) and cached opportunistically for offline navigation.
  Quest detail pages (`/quests/*`) are cached on demand after their first visit via the runtime
  cache. Precaching runs during the `install` event using a versioned cache name, e.g.
  `dspace-precache-v${CACHE_VERSION}`. The install handler uses a resilient `safePrecache()`
  function that handles individual fetch failures without throwing, ensuring the service worker
  activates even if some assets are temporarily unavailable.
- **Feature flag config**: Warm `/config.json` into the runtime cache during `install`, then serve it
  with a network-first strategy so flag updates flow through while offline clients keep the last
  successful response.
- **Runtime cache**: Employ a stale-while-revalidate strategy for quest JSON, NPC bios, and media
  assets. Cache misses fall back to the network; failures surface a friendly offline toast.
  **HTML exclusion**: Runtime caches now include Content-Type guards (case-insensitive per RFC 2045)
  that prevent HTML responses from being cached in `RUNTIME_NAME`. This ensures only CSS, JS, JSON,
  and media assets are retained across versions, while HTML is always served fresh or from the
  dedicated navigation cache.
- **Offline notification**: The global layout loads `installOfflineToast` from
  `frontend/public/scripts/offlineToast.js` via the public `/scripts/offlineToast.js` path, wiring
  `window` online/offline events to an accessible status toast. It now announces when connectivity
  returns before auto-hiding so players know their data is syncing again.
- **Versioning**: Store the current `CACHE_VERSION` inside `localStorage` (key
  `dspace-cache-version`) to detect mismatches. The global layout loads
  `/cache-version.js` on boot, writes `self.CACHE_VERSION` to storage, and fires a
  `dspace-cache-version-change` event when the value changes so listeners can
  react. The `frontend/public/cache-version.js` helper is generated from
  `@dspace/cache-version` so any bump propagates to the worker automatically.
  Upgrade flows should delete outdated caches and trigger a silent reload after
  assets finish refreshing.

## Cache Hygiene

- **Navigation cache cleanup**: The `NAVIGATION_CACHE` (named `dspace-pages-v${CACHE_VERSION}`)
  retains only the **current version** of cached HTML. On service worker activation, old navigation
  caches are deleted immediately to prevent stale HTML from referencing removed hashed assets
  (CSS/JS files with content hashes in `/_astro/`). This single-version policy ensures users never
  see 404 errors for stylesheets or scripts after deployments.
- **Multi-version asset retention**: Runtime and precache caches maintain `MAX_CACHE_HISTORY` (2)
  versions to support gradual rollover. This allows both the old and new versions of CSS/JS/JSON
  assets to coexist temporarily, preventing cache misses during the transition period when some
  clients haven't updated yet.
- **Content-Type validation**: All cache write operations in `cacheFirstAsset()` and
  `handleRuntimeRequest()` check the response's `Content-Type` header (normalized to lowercase)
  before caching. Responses with `text/html` are excluded from runtime caches, ensuring HTML is
  only cached in the navigation cache where it can be properly versioned and cleaned up.

## Save Data Migration

- Persist quest progress in IndexedDB with a schema version number.
- Fixtures for historic save formats live under `tests/fixtures/save-data/` (see
  `v1-basic.json` for the legacy schema); keep conversion scripts idempotent.
- Downgrades use the latest backward-compatible fixture. Document incompatible changes and recovery
  steps in release notes.

## Rollback Procedure

1. Add `offlineWorker.enabled=false` to `DSPACE_FEATURE_FLAGS` (surfaced through
   `/config.json`) to disable worker registration without redeploying the site.
2. Invalidate CDN caches for `/service-worker.js` and the worker manifest.
3. Ship a hotfix release that clears stale caches via `self.registration.unregister()` on startup.

## Testing Matrix

- **Service worker resilience**: `tests/serviceWorkerInstallResilience.test.ts` validates that the
  install handler completes successfully even when precache URLs return 404 or other non-OK responses,
  using the resilient `safePrecache()` function.
- **Navigation cache hygiene**: `tests/navigationCacheHygiene.test.ts` confirms that old navigation
  caches are deleted on activation (single-version policy) while runtime/precache caches retain
  multiple versions. Also validates that HTML responses are excluded from runtime caches via
  Content-Type checks.
- **Build output validation**: `tests/buildOutputValidation.test.ts` ensures production builds don't
  contain unbundled `/src/scripts/` paths that would cause 404s. Skips gracefully in SSR mode where
  no static HTML is generated.
- **Offline quest access**: Vitest suites that simulate the service worker caching path and confirm
  quests can start offline using cached payloads live in `tests/offlineQuestCache.test.ts` and
  `tests/offlineFirstDocSync.test.ts`.
- **Integration tests**: `tests/serviceWorkerIntegration.test.ts` validates that the service worker
  registers correctly, imports cache version, uses versioned cache names, and persists version to
  localStorage.
- Run Playwright in offline mode to validate navigation between `/`, `/play`, and `/quests/*`.
- Record coverage for cache-hit and cache-miss branches before promoting the worker to production.

Update this guide whenever the caching scope or schema migrators change.
