---
title: 'NPC docs images floated into body text (2026-03-14)'
slug: '2026-03-14-docs-npc-image-float-regression'
summary: 'Inline CSS in docs markdown floated NPC images left, causing profile text to wrap horizontally beside portraits instead of rendering image-first blocks.'
---

# NPC docs images floated into body text (2026-03-14)

- **Summary**: `/docs/npcs` rendered portraits and biography text on the same horizontal line, making sections hard to read.
- **Impact**: Visual regression on staging docs pages; NPC entries appeared misaligned and inconsistent with the rest of docs rendering.
- **Root cause**:
    - `frontend/src/pages/docs/md/npcs.md` included an embedded `<style>` block with a global `img { float: left; ... }` rule.
    - The global selector applied to every image in the document, overriding expected block presentation.
- **Resolution**:
    - Removed inline `<style>` blocks from docs markdown pages that injected image-specific CSS.
    - Added a markdown safety regression test that fails when any docs markdown file contains embedded `<style>` blocks.
- **Lessons**:
    - Presentation rules should live in page/component styles, not in ad-hoc markdown HTML style blocks.
    - Broad selectors like `img` inside docs content can cause layout regressions across an entire page.
- **Prevention**:
    - `frontend/tests/docsMarkdownSafety.test.ts` now guards against embedded `<style>` tags in docs markdown.
