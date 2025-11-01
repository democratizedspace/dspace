# Offline-First Strategy

The DSPACE frontend must keep core gameplay reachable without a network connection. This runbook
summarises the caching model, data versioning guarantees, and recovery steps for the service worker
stack. The production worker ships from `frontend/public/service-worker.js`.
It reads the shared `CACHE_VERSION` defined in `@dspace/cache-version`, ensuring
both the app shell and worker invalidate caches in lockstep.

## Cache Responsibilities

- **Precache routes**: `/`, `/play`, `/quests`, `/settings`, and the static assets
  required to boot the shell (compiled JS/CSS, fonts, favicons). Quest detail pages (`/quests/*`)
  are cached on demand after their first visit via the runtime cache.
  Precaching runs during the `install` event using a versioned cache name,
  e.g. `dspace-precache-v${CACHE_VERSION}`.
- **Runtime cache**: Employ a stale-while-revalidate strategy for quest JSON, NPC bios, and media
assets. Cache misses fall back to the network; failures surface a friendly offline toast.
- **Offline notification**: The global layout loads `installOfflineToast` from
  `frontend/src/scripts/offlineToast.js`, wiring `window` online/offline events to an accessible
  status toast so players get immediate feedback when the browser drops offline.
- **Versioning**: Store the current `CACHE_VERSION` inside `localStorage` (key
  `dspace-cache-version`) to detect mismatches. The global layout loads
  `/cache-version.js` on boot, writes `self.CACHE_VERSION` to storage, and fires a
  `dspace-cache-version-change` event when the value changes so listeners can
  react. The `frontend/public/cache-version.js` helper is generated from
  `@dspace/cache-version` so any bump propagates to the worker automatically.
  Upgrade flows should delete outdated caches and trigger a silent reload after
  assets finish refreshing.

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

- Vitest suites that simulate the service worker caching path and confirm quests can start offline
  using cached payloads live in `tests/offlineQuestCache.test.ts`.
- Run Playwright in offline mode to validate navigation between `/`, `/play`, and `/quests/*`.
- Record coverage for cache-hit and cache-miss branches before promoting the worker to production.

Update this guide whenever the caching scope or schema migrators change.
