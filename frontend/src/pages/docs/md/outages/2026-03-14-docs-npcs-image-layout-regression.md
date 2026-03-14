---
title: 'Docs NPC image layout regression from floated markdown styles (2026-03-14)'
slug: '2026-03-14-docs-npcs-image-layout-regression'
summary: 'Documented /docs/npcs image/text horizontal drift caused by a floated global img rule in markdown, then added guardrail tests.'
---

# Docs NPC image layout regression from floated markdown styles (2026-03-14)

- **Window**: 2026-03-14 UTC (staging)
- **Symptoms**:
    - `/docs/npcs` rendered portraits floated left with adjacent paragraphs and lists wrapping to the right.
    - Visual scan suggested the same markdown styling pattern could break additional docs pages.
- **Impact**: Docs readability degraded; NPC bios and dialogue bullets became hard to scan.

## Root cause

- `frontend/src/pages/docs/md/npcs.md` contained an embedded markdown `<style>` block with
  `img { float: left; ... }`, which applied broadly to every image in that doc.
- A missing blank line after one image increased the chance of inline-like rendering glitches when
  markdown content changed.

## Resolution

- Replaced the global floated `img` rule with a dedicated `.npc-portrait` class and block layout,
  then applied that class to NPC portrait tags.
- Added missing blank-line separation around raw `<img>` tags in `npcs.md`.
- Added an automated markdown formatting guardrail test to keep raw image tags padded by blank
  lines and to block floated image rules inside markdown `<style>` blocks.

## Prevention

- Keep markdown image styling opt-in (`.class`) instead of global `img` selectors in docs pages.
- Require docs markdown guardrail tests to run in CI to catch future formatting drift.

## Verification

- `npm run test:root -- frontend/tests/docsMarkdownImageFormatting.test.ts`
- `npm run link-check`
