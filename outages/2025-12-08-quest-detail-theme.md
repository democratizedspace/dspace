# quest-detail-page-layout-gaps

- **Date:** 2025-12-08
- **Component:** frontend/ui/quests/detail
- **Root cause:** Quest detail rendered in the bare layout without navigation or theme spacing.
- **Resolution:** Wrapped quest detail content in Page and Card components to restore spacing.
- **References:**
  - frontend/src/pages/quests/[id].astro
