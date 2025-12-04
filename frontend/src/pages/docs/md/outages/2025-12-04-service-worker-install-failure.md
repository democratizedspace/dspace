---
slug: '2025-12-04-service-worker-install-failure'
title: Service worker install failure after deploy
---

**Summary:** SW install failed because precache included HTML routes that returned non-OK responses. New SW never activated; old SW served stale HTML referencing removed hashed assets, causing CSS/JS 404s.

**Impact:** Users saw unstyled “rocket page” after deployments; dynamic imports broke; offlineToast path 404ed.

**Root cause:** Using cache.addAll on routes that were not safe to precache; HTML cached by old SW; offlineToast referenced via /src path.

**Resolution:** Removed HTML from precache, rewrote install to be resilient, enforced network-first navigation, fixed offlineToast import, restored correct update flow.

**Lessons:** Never precache HTML routes in Astro/Vite apps; install handlers must never throw; always use network-first HTML to avoid stale hashed assets.
