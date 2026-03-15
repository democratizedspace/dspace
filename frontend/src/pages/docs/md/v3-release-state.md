---
title: 'v3 Release State'
slug: 'v3-release-state'
---

# v3 Release State

This page is the canonical status snapshot for DSPACE v3.

Use it together with the launch notes at [/changelog#20260401](/changelog#20260401) and the QA
checklist at
[`docs/qa/v3.md`](https://github.com/democratizedspace/dspace/blob/v3/docs/qa/v3.md).

## What shipped and is live in v3

### Core gameplay loops

- Quest progression (`/quests`) is live with active tree-based progression.
- Inventory and process loops (`/inventory`, `/processes`) are live.
- Achievement/title progression (`/achievements`, `/titles`) is live.
- Player metrics (`/stats`) are live.

### Utility + operations pages

All of these are now reachable from the **More** menu:

- `/gamesaves` (save import/export)
- `/cloudsync` (GitHub gist sync)
- `/contentbackup` (custom content backup)
- `/toolbox` (save/content/diagnostics hub)
- `/settings` (preferences + migration + auth controls)
- `/leaderboard` (metaguild donor board)

### v3 custom content system

v3 includes first-class custom authoring and management:

- Quest create/manage/edit: `/quests/create`, `/quests/manage`, `/quests/:id/edit`
- Item create/manage/edit: `/inventory/create`, `/inventory/manage`,
  `/inventory/item/:itemId/edit`
- Process create/manage/edit: `/processes/create`, `/processes/manage`,
  `/processes/:processId/edit`
- Content backup + transfer: `/contentbackup`

### Save architecture + safety

- v3 uses IndexedDB as primary storage.
- Legacy upgrade paths are available for v1 cookie and v2 localStorage saves.
- Manual game-save export/import remains available through `/gamesaves`.

### AI and NPC chat

- v3 ships with OpenAI-backed chat flows in `/chat`.
- Persona NPC chat support is live for in-game companion interactions.

## Intentionally deferred after v3.0.0

### token.place

- token.place is integrated behind feature-gated config but not enabled for default v3 gameplay.
- See [/docs/token-place](/docs/token-place) for current opt-in status and boundaries.

### Guild gameplay depth

- `/guilds` still serves as a planning/landing destination.
- Full guild mechanics (membership gameplay, shared inventories, federated guild play) remain
  deferred.
- See [/docs/guilds](/docs/guilds).

### Locations destination

- `/locations` remains marked coming soon.

## Notes on removed assumptions from older docs

- dUSD/dWatt/dCarbon are in-game progression currencies in v3, not on-chain assets.
- localStorage is no longer the primary game-state store.

## Documentation update checklist (v3 correctness)

When editing gameplay docs, verify all three:

1. The route exists and is reachable from current UI navigation.
2. The described behavior matches either the v3 changelog or `docs/qa/v3.md`.
3. Partial systems are described explicitly (what works now vs what is planned).
