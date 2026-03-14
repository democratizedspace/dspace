# 2026-03-14 – Docs NPC image float regression

- **Date**: 2026-03-14
- **Component**: docs/markdown-rendering (`/docs/npcs` and related docs markdown pages)
- **Root cause**: Markdown-embedded global image CSS (`img { float: left; ... }`) inside inline `<style>` blocks changed image layout and caused profile text wrapping regressions.
- **Resolution**: Removed embedded markdown style blocks and added a guard test that rejects `<style>` tags in docs markdown.
- **References**:
  - https://github.com/democratizedspace/dspace/pull/3965
  - frontend/src/pages/docs/md/outages/2026-03-14-docs-npc-image-float-regression.md
  - frontend/tests/docsMarkdownSafety.test.ts
