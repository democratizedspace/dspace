# achievements-page-theme-override

- **Date:** 2025-12-08
- **Component:** frontend/ui/achievements
- **Root cause:** Achievements set a custom green body background that overrode the shared theme.
- **Resolution:** Deleted the page-specific background so the global DSPACE styling stays applied.
- **References:**
  - frontend/src/pages/achievements/index.astro
