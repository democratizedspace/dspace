# Offline-First Strategy

The DSPACE frontend must keep core gameplay reachable without a network connection. This runbook
summarises the caching model, data versioning guarantees, and recovery steps for the service worker
stack.

## Cache Responsibilities

- **Precache routes**: `/`, `/play`, `/quests/*`, `/settings`, and the static assets required to boot
the shell (compiled JS/CSS, fonts, favicons). Precaching runs during the `install` event using a
versioned cache name, e.g. `dspace-precache-v${CACHE_VERSION}`.
- **Runtime cache**: Employ a stale-while-revalidate strategy for quest JSON, NPC bios, and media
assets. Cache misses fall back to the network; failures surface a friendly offline toast.
- **Versioning**: Store the current `CACHE_VERSION` inside `localStorage` to detect mismatches.
Upgrade flows should delete outdated caches and trigger a silent reload after assets finish
refreshing.

## Save Data Migration

- Persist quest progress in IndexedDB with a schema version number.
- Fixtures for historic save formats live under `tests/fixtures/save-data/` (see
  `v1-basic.json` for the legacy schema); keep conversion scripts idempotent.
- Downgrades use the latest backward-compatible fixture. Document incompatible changes and recovery
steps in release notes.

## Rollback Procedure

1. Flip the feature flag `offlineWorker.enabled` to `false` in the config service to disable the
   worker registration.
2. Invalidate CDN caches for `/service-worker.js` and the worker manifest.
3. Ship a hotfix release that clears stale caches via `self.registration.unregister()` on startup.

## Testing Matrix

- Vitest suites that simulate the service worker caching path and confirm quests can start offline
  using cached payloads live in `tests/offlineQuestCache.test.ts`.
- Run Playwright in offline mode to validate navigation between `/`, `/play`, and `/quests/*`.
- Record coverage for cache-hit and cache-miss branches before promoting the worker to production.

Update this guide whenever the caching scope or schema migrators change.
