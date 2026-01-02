---
title: 'Quests SSR glob failure and layout regression (2025-12-30–2026-01-01)'
slug: '2026-01-02-quests-ssr-overflow'
summary: 'Documented the /quests SSR 500s from runtime glob output and the horizontal overflow/collapsed tile regressions, plus prevention steps.'
---

# Quests SSR glob failure and layout regression (2025-12-30–2026-01-01)

- **Window**: 2025-12-30 08:00 UTC – 2026-01-01 06:30 UTC (approx)
- **Impact**: Staging-only; QA blocked for quests flows and layout verification
- **Symptoms**:
    - `/quests` and related quest routes returned SSR 500s referencing missing `glob` in built output
    - Quests page showed document-level horizontal overflow and the main quest tile text collapsed to
      word-per-line
- **Root cause**:
    - `Astro.glob` compiled to a runtime `glob` import in SSR bundles; the `glob` package was not
      present in the container, and quest JSON files were not emitted to `dist/`
    - QuestGraphVisualizer shelves used grid auto-columns without width clamps, and quest tile text
      lacked `flex: 1 1 auto` / `min-width: 0`, causing content-driven overflow and collapsing text
- **Fix**:
    - Replaced runtime quest loading with build-time `import.meta.glob` and refactored quest graph to
      accept pre-loaded data to remove filesystem and `glob` runtime dependencies
    - Switched visualizer shelves to flex with internal overflow scroll, clamped widths, and added
      min-width/flex fixes to the quest tile text container
- **Fix PRs**: [#2547](https://github.com/democratizedspace/dspace/pull/2547) (SSR glob),
  [#2548](https://github.com/democratizedspace/dspace/pull/2548) (overflow/layout)
- **Prevention**:
    - Keep Playwright coverage for /quests overflow, min-width, and padding guardrails at 1920x1080
    - Add build-output checks for runtime-only dependencies (fail if SSR bundles import `glob` or
      other fs-backed modules); keep `pnpm -C frontend build` in triage playbook
