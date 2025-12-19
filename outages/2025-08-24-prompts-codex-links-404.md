# prompts-codex-links-404

- **Date:** 2025-08-24
- **Component:** docs
- **Root cause:** Absolute links in baseline.md used /docs/ paths which GitHub treated as external, returning 404.
- **Resolution:** Replaced absolute links with relative paths and added a regression test.
- **References:**
  - frontend/src/pages/docs/md/prompts-codex.md
  - tests/promptsCodexLinks.test.ts
