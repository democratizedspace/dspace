---
title: 'v3 release state'
slug: 'v3-release-state'
---

## Chat provider reality

DSPACE v3 ships with **OpenAI-only chat**. The token.place integration exists in the codebase, but
it is deferred to v3.1 while the token.place API v1 is finished and deployed. See
[/docs/token-place](/docs/token-place) for the authoritative status and enablement details.

## v2-only mechanics removed / not applicable in v3

- v2 localStorage save keys (`gameState`, `gameStateBackup`) are legacy. On first launch, v3
  migrates legacy v2 saves into IndexedDB and removes the old localStorage keys, so the v2
  localStorage-only save format is no longer the active runtime path in v3.
  (See [/changelog#20260301](/changelog#20260301).)
- **Legacy behavior (historical):** v2.1 stored all game state in localStorage and introduced
  `/gamesaves` import/export to move that localStorage blob around. Treat this as historical
  v2 behavior; it should not be treated as current v3 storage behavior.
  (See [/changelog#20230915](/changelog#20230915).)
- Blockchain integration plans were removed in v3, so any v2-era tokenization or Web3 roadmap
  expectations are not applicable to current v3 mechanics.
  (See [/changelog#20260301](/changelog#20260301).)
