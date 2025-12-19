# inventory-create-page-theme-gap

- **Date:** 2025-12-08
- **Component:** frontend/ui/inventory/create
- **Root cause:** Inventory creation used bare layout and custom colors, diverging from the shell.
- **Resolution:** Moved the form into Page and Card components with themed framing for consistency.
- **References:**
  - frontend/src/pages/inventory/create.astro
