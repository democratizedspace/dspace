---
title: 'Custom quest completed-list regression (2026-04-16)'
slug: '2026-04-16-custom-quest-completed-list-regression'
summary: 'Completed custom quests were kept in the Custom Quests section with an inline Completed label instead of being listed under Completed Quests.'
---

# Custom quest completed-list regression (2026-04-16)

- **Summary**: Custom quests that reached completion remained in the Custom Quests section and showed an inline `Completed` label.
- **Impact**: Completed custom quests were not grouped with the rest of completed quests, causing inconsistent UI behavior and duplicate completion signaling.
- **Root cause**:
    - The custom quest filter treated both `available` and `completed` quests as visible in the Custom Quests section.
    - Only built-in quests were eligible for the Completed Quests list.
- **Resolution**:
    - Updated quest list classification so the Custom Quests section only shows available custom quests.
    - Added completed custom quests to the shared Completed Quests list alongside built-in quests.
    - Added regression coverage to ensure completed custom quests no longer render in Custom Quests and appear under Completed Quests instead.
- **Prevention**:
    - Keep custom and built-in quest status handling aligned in list rendering logic.
    - Maintain regression tests for mixed built-in/custom completion states.
