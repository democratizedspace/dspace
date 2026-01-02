---
slug: '2026-01-06-quests-regressions'
title: '2026-01-06 – /quests SSR 500s and layout regressions'
summary: >-
    Documented SSR 500s from runtime glob usage and /quests horizontal overflow with collapsed
    quest tiles; added prevention notes.
---

## Timeline

- **2026-01-05 19:45–21:10 UTC**: `/quests` returned HTTP 500 during SSR; staging smoke tests
  failed.
- **2026-01-06 14:05–15:20 UTC**: `/quests` rendered but showed a horizontal scrollbar and the
  Active Quest tile text collapsed to a few characters per line.
- **2026-01-06 16:00 UTC**: Fixes for both regressions were merged and staging QA was unblocked.

## Symptoms

- `/quests` threw SSR 500 errors when Astro tried to execute `glob` at runtime.
- On wide screens (1920x1080+), the document gained horizontal overflow and the quest tile text
  column collapsed, making the page unreadable.

## Impact

- Staging-only: QA could not verify quests due to SSR failures first, then due to unusable layout.

## Root causes

- Runtime dependency on `glob` (and `Astro.glob`) inside `/quests` routes that is not available
  in the SSR runtime bundle.
- Quest graph shelves used grid auto-columns without width clamps, and quest tile text containers
  lacked `min-width: 0`/flex sizing, causing overflow and text collapse.

## Fix

- Replaced runtime `Astro.glob`/`glob.sync` usage with build-time generated JSON for quest/process
  metadata to make SSR deterministic ([PR #2547](https://github.com/democratizedspace/dspace/pull/2547)).
- Switched quest graph shelves to clamped flex rows with horizontal scroll and gave quest tiles
  explicit min-width/flex sizing to prevent overflow and text collapse
  ([PR #2548](https://github.com/democratizedspace/dspace/pull/2548)).

## Prevention

- Keep `/quests` under Playwright coverage for overflow, min-width, and readable text assertions
  at 1920x1080.
- Add build-output checks that fail if runtime bundles include `glob` or other Node-only deps in
  `/quests` routes; prefer build-time data generation.
