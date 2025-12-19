# prompts-outages-link-404

- **Date:** 2025-08-22
- **Component:** docs
- **Root cause:** Absolute link used '/docs/prompts-outages', which GitHub interpreted as an external path and returned 404.
- **Resolution:** Updated cross references to use a relative path and removed redundant section.
- **References:**
  - frontend/src/pages/docs/md/prompts-codex.md
  - docs/prompts/codex/ci-fix.md
