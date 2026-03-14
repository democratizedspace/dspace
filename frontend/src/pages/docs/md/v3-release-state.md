---
title: 'v3 Release State'
slug: 'v3-release-state'
---

# v3 Release State

This page is the player-facing status summary for what v3 shipped, what is live now, and what is
explicitly deferred.

## Live in v3

- Expanded quest catalog and skill tree coverage
- In-game custom content editors for quests, items, and processes
- Local-first save architecture (IndexedDB primary, legacy migration support)
- Backup workflows: game saves, custom content backups, and cloud sync
- NPC persona chat with OpenAI-backed context grounding
- More-menu destinations promoted from placeholders to live surfaces (Stats, Titles, Toolbox,
  Leaderboard)

## Deferred / constrained in v3

- Chat provider support is **OpenAI-only** in production today
- token.place integration is deferred pending token.place API v1 readiness
- Full multiplayer guild mechanics and ActivityPub federation are still roadmap work

## Data/storage reality check

- v3 writes canonical save state to IndexedDB.
- Legacy v1 cookies and v2 localStorage saves can be detected and migrated via Settings.
- localStorage is treated as legacy/fallback, not the canonical long-term store.

## Where to verify details

- [April 1, 2026 changelog](/changelog#20260401)
- [State migration](/docs/state-migration)
- [Legacy save storage](/docs/legacy-save-storage)
- [Cloud Sync](/docs/cloud-sync)
- [Routes](/docs/routes)
