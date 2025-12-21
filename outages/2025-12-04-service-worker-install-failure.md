# Service worker install failure (2025-12-04)

## Summary
SW install failed because precache included HTML routes that returned non-OK responses. The new
service worker never activated; the old worker served stale HTML that pointed at removed hashed
assets, triggering CSS/JS 404s.

## Impact
Users saw the unstyled “rocket page” after deployments, dynamic imports broke, and the
offlineToast path 404ed.

## Root cause
- Using `cache.addAll` on HTML routes that were unsafe to precache.
- Old HTML stayed cached without version-specific cleanup.
- `offlineToast` was referenced via a `/src` path instead of a bundled relative import.

## Resolution
- Removed HTML from the precache list, keeping only static assets
  (`/manifest.webmanifest`, `/favicon.ico`, `/assets/logo.png`).
- Implemented a resilient `safePrecache()` function so individual fetch failures no longer abort
  installs.
- Added a versioned navigation cache (`dspace-pages-v${CACHE_VERSION}`) with single-version
  cleanup.
- Added Content-Type guards (case-insensitive) to keep HTML out of runtime caches.
- Enforced network-first navigation with `cache: 'no-store'` for HTML requests.
- Fixed the offline toast import to use a bundler-friendly relative path.
- Restored skip-waiting and `clients.claim()` flow for first-time installs.

## Lessons
- Never precache HTML routes in Astro/Vite apps—use network-first strategy instead.
- Install handlers must never throw; handle each asset failure resiliently.
- HTML caching needs version-specific cleanup to avoid stale asset references.
- Runtime caches should exclude HTML to maintain hygiene across deployments.
- Always use relative imports for scripts loaded in bundled contexts.
