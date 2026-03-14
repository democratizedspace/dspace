---
title: 'v3 Release State'
slug: 'v3-release-state'
---

# v3 Release State

This page is the quick truth-source for what shipped in v3 vs what is deferred.

## Confirmed shipped in v3.0

- OpenAI-backed NPC chat personas are live.
- Core destination routes are live: `/stats`, `/titles`, `/leaderboard`, `/toolbox`, `/settings`.
- Local-first save storage is live (IndexedDB primary) with migration coverage from legacy saves.
- Custom content creation + backup/sync flows are live for quests/items/processes.

## Deferred from v3.0 to v3.1

- token.place provider activation is deferred until token.place API v1 is live.

See [token.place status](/docs/token-place) for the latest integration state.

## Historical mechanics no longer accurate for v3 docs

- Treat old web3/tokenization language as historical context only; v3 gameplay units (dUSD,
  dWatt, dCarbon) are in-game progress/economy systems.
- Treat localStorage-only save assumptions as historical. Current v3 behavior centers on
  IndexedDB, with migration and fallback behavior documented in [State migration](/docs/state-migration)
  and [Legacy save storage](/docs/legacy-save-storage).

## QA source of truth

For release validation details (routes, migration flows, docs/search, chat-provider checks), see
`docs/qa/v3.md` in the repository.
