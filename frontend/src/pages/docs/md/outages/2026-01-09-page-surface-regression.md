---
title: 'Page containers lost surface styling (2026-01-09)'
slug: '2026-01-09-page-surface-regression'
summary: 'Homepage and other menu pages lost their white container backgrounds after Page slot markup switched to list items without corresponding surface styles.'
---

# Page containers lost surface styling (2026-01-09)

- **Summary**: The homepage and other main-menu pages rendered content directly on the dark site background instead of within the expected white cards.
- **Impact**: Poor contrast/readability and broken visual hierarchy across top-level pages; visible on both desktop and mobile.
- **Root cause**:
    - PR that fixed mobile overflow switched Page slots to `<li class="page-section">` wrappers.
    - The previous card-like wrappers were removed, but no replacement surface styles were applied to the new `page-section` elements, leaving them transparent.
- **Resolution**:
    - Added default surface styling to `.page-section` (white background, dark text, padding, radius, border, shadow) to restore the intended containers without reintroducing overflow.
    - Expanded the mobile overflow Playwright coverage to assert that page sections have non-transparent backgrounds, padding, and radius.
- **Lessons**:
    - When changing structural wrappers, carry forward both layout and surface styles (or centralize them) to avoid silent visual regressions.
    - E2E coverage should verify critical presentation invariants, not just overflow metrics.
- **Prevention**:
    - New regression assertions in `mobile-page-overflow.spec.ts` ensure `page-section` elements keep visible surfaces with padding and rounding.
