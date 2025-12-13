# Service worker install failure (2025-12-04)

- **Summary**: SW install failed because precache included HTML routes that returned non-OK responses. New SW never activated; old SW served stale HTML referencing removed hashed assets, causing CSS/JS 404s.
- **Impact**: Users saw unstyled "rocket page" after deployments; dynamic imports broke; offlineToast path 404ed.
- **Root cause**: Using cache.addAll on routes that were not safe to precache; HTML cached by old SW without version-specific cleanup; offlineToast referenced via /src path.
- **Resolution**:
    - Removed HTML from precache list, keeping only static assets (`/manifest.webmanifest`, `/favicon.ico`, `/assets/logo.png`)
    - Implemented resilient `safePrecache()` function that handles individual fetch failures without throwing
    - Added versioned navigation cache (`dspace-pages-v${CACHE_VERSION}`) with single-version cleanup policy
    - Implemented Content-Type guards (case-insensitive) to prevent HTML from being cached in runtime caches
    - Enforced network-first navigation with `cache: 'no-store'` for HTML requests
    - Fixed offlineToast import to use bundler-friendly relative path
    - Restored correct skip-waiting and clients.claim() flow for first-time installs
- **Lessons**:
    - Never precache HTML routes in Astro/Vite apps - use network-first strategy instead
    - Install handlers must never throw - use resilient error handling for each asset
    - HTML caching requires version-specific cleanup to prevent stale asset references
    - Runtime caches should exclude HTML to maintain proper cache hygiene across deployments
    - Always use relative imports for scripts loaded in bundled contexts
