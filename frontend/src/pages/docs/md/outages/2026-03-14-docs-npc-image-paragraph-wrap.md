---
title: 'NPC docs image paragraph-wrap regression (2026-03-14)'
slug: '2026-03-14-docs-npc-image-paragraph-wrap'
summary: 'Fixed docs layout drift where text wrapped beside NPC images when markdown image spacing was malformed.'
---

# NPC docs image paragraph-wrap regression (2026-03-14)

- **Window**: 2026-03-14 (staging)
- **Symptoms**:
    - `/docs/npcs` showed character biography text rendering beside NPC portraits instead of below.
    - Section layout appeared horizontally offset and inconsistent between NPC entries.
- **Impact**: Staging docs readability degraded for NPC references.

## Root cause

A standalone HTML `<img>` line in `npcs.md` was missing the blank line that should follow it.
That let markdown parsing keep the next paragraph attached to the image block, producing inline-like
wrapping behavior.

## Resolution

- Restored a blank line after the affected `<img>` entry in `npcs.md`.
- Added a docs markdown regression test that checks all docs pages for blank-line separation around
  standalone `<img>` tags outside `<figure>` blocks.

## Prevention

- Keep docs image spacing validated in CI through `tests/docsMarkdownImageSpacing.test.ts`.
- When editing docs with raw HTML images, ensure one blank line exists before and after each
  standalone `<img>` line.
