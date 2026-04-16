---
title: 'Custom quest completion list regression (2026-04-16)'
slug: '2026-04-16-custom-quest-completion-list-regression'
summary: 'Completed custom quests stayed in Custom Quests and showed a redundant Completed label instead of appearing with the shared Completed Quests list.'
---

# Custom quest completion list regression (2026-04-16)

- **Summary**: Completing a custom quest left its tile in **Custom Quests** with a visible "Completed"
  status label.
- **Impact**: Players saw inconsistent completion behavior between built-in and custom quests, and
  completed custom quests were not grouped with other completed quests.
- **Root cause**:
    - The quests page filtered custom quests into a single visible list that included both
      `available` and `completed` states.
    - The quest tile component rendered a "Completed" status label for completed quests.
- **Resolution**:
    - Updated custom quest list handling so only `available` custom quests stay in **Custom Quests**.
    - Merged completed custom quests into the shared **Completed Quests** list rendering path.
    - Removed the visual "Completed" status label from quest tiles.
    - Added regression test coverage to ensure completed custom quests render with completed quests.
- **Prevention**:
    - Keep custom and built-in quest completion presentation on a shared rendering path whenever
      possible.
    - Add explicit tests for custom quest state transitions between actionable and completed sections.
