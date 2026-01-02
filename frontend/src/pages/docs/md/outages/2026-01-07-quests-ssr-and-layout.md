---
title: '2026-01-07 – /quests SSR and layout regressions'
slug: '2026-01-07-quests-ssr-and-layout'
summary: 'Documented /quests SSR 500 from runtime glob dependency and overflow/collapsed tile regressions.'
---

## Summary

Two regressions hit the /quests surface on 2026-01-07 (approx. 14:30–18:00 UTC):

- Astro SSR 500s on `/quests` because a runtime glob dependency was bundled into the route.
- The quests index rendered with horizontal overflow at desktop widths and the main quest tile
  text column collapsed into single-word lines.

## Impact

- Staging-only; QA blocked while the page failed to render or was unreadable.
- No production traffic or data loss, but QA cycles slipped by ~half a day.

## Symptoms

- `/quests` returned HTTP 500 during SSR, with stack traces pointing to filesystem access from
  `glob` at runtime.
- After the SSR fix, the page loaded but showed a document-level horizontal scrollbar on
  ≥1920px viewports.
- The Active Quest tile text shrunk to min-content width, wrapping almost every word.

## Root cause

- Quest routes were using `Astro.glob` and `glob.sync` at runtime, pulling `glob` into the SSR
  bundle. On the server, the dependency attempted filesystem access not permitted in the
  runtime environment, triggering 500s.
- QuestGraphVisualizer used an unconstrained grid plus missing `min-width: 0` on flex/grid
  children, allowing shelves and tiles to overflow the viewport.
- Quest tile content lacked `flex: 1 1 auto` and `min-width: 0`, letting the thumbnail shrink
  the text column to a few pixels.

## Resolution

- Replaced runtime `Astro.glob` / `glob.sync` usage with build-time imports to keep `glob` out
  of the SSR bundle ([PR #2547](https://github.com/democratizedspace/dspace/pull/2547)).
- Switched the quest shelf to flex with horizontal scroll, clamped widths, and added
  `min-width: 0` plus responsive sizing for quest cards; restored quest tile text width and
  padding ([PR #2548](https://github.com/democratizedspace/dspace/pull/2548)).

## Prevention

- Keep filesystem globs build-time only; add build-output checks that fail if runtime bundles
  include `glob` or other Node-only dependencies.
- Maintain Playwright coverage that asserts no document-level horizontal overflow, shelf cards
  honoring `overflow-x: auto`, and quest tile text containers meeting minimum width/padding
  thresholds.
