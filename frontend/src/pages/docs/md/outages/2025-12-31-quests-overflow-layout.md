---
title: 'Quests page horizontal overflow and tile layout (2025-12-31)'
slug: '2025-12-31-quests-overflow-layout'
summary: 'Fixed horizontal overflow on /quests and collapsed quest tile text column after QuestGraphVisualizer changes.'
---

# Quests page horizontal overflow and tile layout (2025-12-31)

- **Summary**: The /quests page had document-level horizontal overflow at wide viewports, and the main Active Quest tile had a collapsed text column causing word-per-line wrapping.
- **Impact**: Page hard to use on wide screens (1920x1080+); horizontal scrollbar appeared; quest tile text was unreadable; QA blocked due to confusing layout.
- **Root cause**:
    - QuestGraphVisualizer used CSS grid with `grid-auto-columns: minmax(220px, 1fr)` which allows columns to expand indefinitely beyond the viewport
    - Missing `min-width: 0` on flex/grid containers propagated content-based overflow (classic flexbox min-content sizing trap)
    - Quest tile in Quest.svelte had text container missing `flex: 1 1 auto` and `min-width: 0`, causing text column to collapse
    - Large `margin: 50px` on anchor elements in Quests.svelte contributed to layout issues
- **Resolution**:
    - Changed QuestGraphVisualizer shelf cards from CSS grid to flexbox with internal horizontal scroll (`display: flex; flex-wrap: nowrap; overflow-x: auto; max-width: 100%`)
    - Added width clamping to visualizer root and containers (`width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box`)
    - Fixed Quest.svelte text container with `flex: 1 1 auto; min-width: 0`
    - Fixed image sizing with `flex: 0 0 200px` to prevent shrinking
    - Changed QuestGraphCard sizing to `width: clamp(280px, 28vw, 420px)` for responsive card widths
    - Removed margin: 50px on anchors, using grid gap instead
    - Added comfortable padding (16px 24px) to quest tile text container
- **Lessons**:
    - Always use `min-width: 0` on flex/grid children that should shrink below their content size
    - Avoid CSS grid `minmax(..., 1fr)` patterns without explicit container width constraints
    - Use flexbox with `overflow-x: auto` for horizontal scrolling shelves instead of grid auto-columns
    - Test layouts at wide viewports (1920x1080+) to catch overflow issues
    - Add `data-testid` attributes for stable E2E test selectors
- **Prevention**: Added Playwright E2E regression tests covering:
    - No document-level horizontal overflow at 1920x1080
    - Visualizer shelf cards have `overflow-x: auto` styling
    - Visualizer cards have minimum width >= 280px
    - Quest tile text column has minimum width >= 180px
    - Quest tile text column has padding-right >= 16px
