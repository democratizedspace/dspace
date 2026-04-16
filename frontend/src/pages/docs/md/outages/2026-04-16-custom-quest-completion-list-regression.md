---
title: 'Custom quest completion list regression (2026-04-16)'
slug: '2026-04-16-custom-quest-completion-list-regression'
summary: 'Completed custom quests were left in the Custom Quests section with a Completed badge instead of being listed with other completed quests.'
---

# Custom quest completion list regression (2026-04-16)

- **Summary**: Completed custom quests stayed in the "Custom Quests" section and rendered a
  visible "Completed" label.
- **Impact**: Completed custom quests were split away from the canonical "Completed Quests"
  section, creating inconsistent UX between built-in and custom quests.
- **Root cause**:
    - Custom quest filtering allowed both `available` and `completed` statuses in the actionable
      custom grid.
    - The completed quest list only rendered built-in completed quests.
- **Resolution**:
    - Updated custom quest filtering so the "Custom Quests" section only shows actionable
      `available` custom quests.
    - Merged completed custom quests into the same completed quest list used by built-in quests.
    - Added regression coverage to ensure completed custom quests render under "Completed Quests"
      and not under "Custom Quests."
- **Prevention**:
    - Keep list partitioning explicit by source + status, with regression tests for each
      visible quest section.
