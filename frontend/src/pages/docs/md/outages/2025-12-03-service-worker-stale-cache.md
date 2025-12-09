---
title: '2025-12-03 – Service worker stale cache'
slug: '2025-12-03-service-worker-stale-cache'
summary: 'Fixed CSS 404 errors after deployments by injecting cache version into service worker build.'
---

## Summary

After some deployments, staging.democratized.space would render with a giant rocket and largely
unstyled layout until users performed a hard reload. The browser console showed repeated 404
errors for hashed assets like `/_astro/index.<hash>.css`.

The root cause was that the service worker cached the old HTML with references to old hashed
asset filenames, but those files were replaced by new hashes in the deployment. The service
worker file itself (`service-worker.js`) wasn't changing between builds, so browsers never
detected an update and continued serving stale cached content.

## Impact

-   Users visiting after a deployment would see an unstyled page with missing CSS assets.
-   The layout would display a large rocket image without proper styling.
-   Functionality was degraded but the site remained partially usable.
-   Users had to perform a hard reload (Ctrl+F5 or Cmd+Shift+R) to clear the cache and see the
    correct styled version.

## Resolution

-   Created a service worker template (`service-worker.template.js`) with a `__CACHE_VERSION__`
    placeholder.
-   Implemented a build-time injection script (`inject-cache-version-into-sw.mjs`) that reads
    the current `CACHE_VERSION` from `packages/cache-version/index.js` and generates
    `service-worker.js` with the actual version embedded.
-   Exported `resolveCacheVersion()` from `sync-cache-version.mjs` for reuse across build
    scripts.
-   Integrated the injection process into the prebuild workflow so every build produces a
    different service worker file.
-   Added comprehensive E2E tests with Playwright to verify:
    -   Service worker registers and caches assets correctly
    -   Service worker updates when cache version changes
    -   CSS assets remain accessible during updates (no 404s)
    -   SKIP_WAITING and reload logic executes properly

## Technical Details

The service worker now embeds `CACHE_VERSION` at build time:

```javascript
const SW_CACHE_VERSION = '20251203-abc123'; // Injected at build time
self.CACHE_VERSION = SW_CACHE_VERSION;

const PRECACHE_NAME = `dspace-precache-v${SW_CACHE_VERSION}`;
const RUNTIME_NAME = `dspace-runtime-v${SW_CACHE_VERSION}`;
```

This ensures that:

1. Each build produces a unique service worker file with a new cache version.
2. Browsers detect the changed service worker file and trigger the update mechanism.
3. The SKIP_WAITING message is sent and the page reloads with the new cache keys.
4. Old cache entries are cleaned up during the activate phase.

## Lessons / Follow-ups

-   Service workers must change between deployments to trigger browser update detection.
-   Build-time injection is more reliable than runtime `importScripts()` for cache versioning.
-   E2E tests should verify the complete service worker lifecycle, not just unit-level behavior.
-   Cache version mismatches between HTML and assets will cause 404s if the SW doesn't update.
-   Always test deployment scenarios in staging to catch cache invalidation issues before
    production.
