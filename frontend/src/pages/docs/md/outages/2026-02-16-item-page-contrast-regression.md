---
title: 'Inventory item pages lost contrast after selectable text update (2026-02-16)'
slug: '2026-02-16-item-page-contrast-regression'
summary: 'Static chip containers on inventory item pages became visually washed out, reducing contrast between the dark background and item detail surfaces.'
---

# Inventory item pages lost contrast after selectable text update (2026-02-16)

- **Summary**: Inventory item detail pages looked washed out after the text-selectable chip update, making card surfaces blend into the page background.
- **Impact**: Reduced readability and weaker visual hierarchy on `/inventory/item/*` pages.
- **Root cause**:
    - The static (non-interactive) `Chip` variant inherited a shared `opacity: 0.8` style meant for interactive chips.
    - When item page content moved into a static chip container for text selection, that inherited opacity lowered surface contrast.
- **Resolution**:
    - Added a dedicated `static-container` class for static chips and forced full opacity (`opacity: 1`) for that variant.
    - Added regression tests for both `Chip` and `ItemPage` to verify static item-page containers stay non-button and fully opaque.
- **Lessons**:
    - Shared visual styles between interactive and static variants should be explicitly overridden where readability depends on stronger contrast.
- **Prevention**:
    - New tests assert static chip containers render as non-interactive markup and keep full opacity.
