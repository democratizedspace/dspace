---
title: 'Custom quest completion listing regression (2026-04-16)'
slug: '2026-04-16-custom-quest-completion-listing-regression'
summary: 'Completed custom quests were shown in Custom Quests with a visible Completed label instead of being listed alongside all completed quests.'
---

# Custom quest completion listing regression (2026-04-16)

- **Summary**: Completed custom quests remained in the **Custom Quests** section and showed a visible "Completed" label.
- **Impact**: Players saw inconsistent completion behavior between built-in and custom quests on `/quests`.
- **Root cause**:
    - Custom quest filtering included both `available` and `completed` statuses for the Custom Quests section.
    - The tile component rendered a visible `Completed` status label for completed quests.
- **Resolution**:
    - Updated quest list classification usage so custom completed quests render under **Completed Quests**.
    - Removed the visible `Completed` status label from quest tiles while preserving completion state handling.
    - Added regression coverage to verify completed custom quests appear in **Completed Quests** and not in **Custom Quests**.
- **Prevention**:
    - Keep completed quest presentation unified regardless of quest source (built-in vs custom).
    - Maintain explicit regression tests for list placement and status label rendering in `/quests`.
