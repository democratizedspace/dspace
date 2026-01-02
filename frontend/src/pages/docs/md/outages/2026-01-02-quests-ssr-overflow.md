---
title: 'Quests SSR glob regression and overflow layout (2026-01-02)'
slug: '2026-01-02-quests-ssr-overflow'
summary: 'Documented /quests SSR 500 from runtime glob dependency and horizontal overflow/collapsed quest tiles with prevention steps.'
---

# Quests SSR glob regression and overflow layout (2026-01-02)

- **Window**: 2026-01-02 02:30–05:10 UTC (staging)
- **Symptoms**:
    - `/quests` returned SSR 500s; server bundle tried to require `glob` at runtime.
    - `/quests` had document-level horizontal overflow at 1920px+ and quest tiles with collapsed
      text columns.
- **Impact**: Staging only; QA blocked from verifying quests UI and map interactions.

## Root cause

- Quest graph build path relied on `glob.sync` (dev dependency) at runtime; Vite left a
  `require('glob')` call in the server chunk, which production images did not ship, causing
  `MODULE_NOT_FOUND` 500s during SSR.
- QuestGraphVisualizer shelves used grid auto-columns without width clamps and quest tiles lacked
  `min-width: 0` and flexible sizing, letting long content force overflow and squish text columns.

## Resolution

- Replaced runtime `glob` reads with build-time `import.meta.glob` output and generated quest/process
  JSON during the build to remove the runtime dependency (PR
  [#2547](https://github.com/democratizedspace/dspace/pull/2547)).
- Switched QuestGraphVisualizer shelves to horizontal flex scroll, clamped widths, and added
  `min-width`/padding for quest tiles with Playwright coverage (PR
  [#2548](https://github.com/democratizedspace/dspace/pull/2548)).

## Prevention

- Add Playwright assertions that `/quests` has no document-level overflow, visualizer cards keep
  readable minimum widths, and quest tiles preserve text column width and padding.
- During CI image builds, scan server bundles for unbundled runtime dependencies (for example,
  `require('glob')`) and fail fast; prefer `import.meta.glob` or generated artifacts for filesystem
  data.
