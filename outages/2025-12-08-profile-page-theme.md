# profile-page-missing-page-wrapper

- **Date:** 2025-12-08
- **Component:** frontend/ui/profile
- **Root cause:** Profile route skipped the Page layout, so header and menu framing never rendered.
- **Resolution:** Moved profile into Page with a card grid for avatar selection and titles.
- **References:**
  - frontend/src/pages/profile/index.astro
