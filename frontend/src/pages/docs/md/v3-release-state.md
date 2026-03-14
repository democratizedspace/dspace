---
title: 'v3 Release State'
slug: 'v3-release-state'
---

# v3 Release State

This page is the source-of-truth snapshot for what shipped in v3 and what remains deferred.
Use it alongside the v3 launch notes at [/changelog#20260401](/changelog#20260401) and the
full QA checklist in
[docs/qa/v3.md](https://github.com/democratizedspace/dspace/blob/v3/docs/qa/v3.md).

## What is fully live in v3

### Core player systems

- Quest, inventory, and process gameplay loops are live.
- New utility destinations are live from the **More** menu: `/stats`, `/leaderboard`, `/titles`,
  `/toolbox`, `/settings`, `/cloudsync`, `/contentbackup`, and `/gamesaves`.
- Achievements and title progression are live and tied to real gameplay state.

### Custom content tooling (v3 headline)

- Players can create and edit custom quests, items, and processes in-game.
- Player-created content is stored locally and can be exported/imported through
  `/contentbackup`.
- Quest submissions can be prepared through in-game contribution tooling and the
  [Quest Submission Guide](/docs/quest-submission).

### Save safety + migration

- Primary storage is IndexedDB in v3.
- Legacy save upgrade paths exist for v1 cookies and v2 localStorage saves.
- Import/export and backup routes are available to reduce save loss risk before major changes.

### AI chat

- v3 ships OpenAI-only chat flows for `/chat` and persona-style in-game NPC chat.

## Deferred or intentionally limited in v3

### token.place integration

- token.place is deferred to v3.1.
- Current status and onboarding requirements are tracked in [/docs/token-place](/docs/token-place).

### Full guild gameplay

- Guild route and mechanics are still marked as coming soon in navigation.
- Leaderboard support and Metaguild narrative framing are present, but full guild membership,
  cooperative guild inventories, and ActivityPub-connected multiplayer are not live yet.
- See [/docs/guilds](/docs/guilds) for the current plan and boundaries.

### Locations destination

- `/locations` is still a coming-soon destination in the More menu.

## v2-only mechanics removed / not applicable in v3

- **Blockchain/Web3 roadmap assumptions are removed in v3.** dWatt, dUSD, and related units are
  in-game progression currencies, not on-chain assets.
- **LocalStorage is no longer primary storage.** It is legacy import material; v3 uses IndexedDB.
- **Legacy migration behavior is explicit.** Legacy keys/artifacts are treated as migration sources,
  not active storage.

## Verification checklist for docs and QA

When you update gameplay docs, verify these points against the current build:

1. Route is actually reachable and not marked coming soon.
2. Behavior matches either the v3 changelog or `docs/qa/v3.md` checklist outcomes.
3. If a system is partially live (for example, guild framing vs guild mechanics), document both the
   available and unavailable parts.
4. Include links to the canonical docs pages (`/docs/routes`, `/docs/quest-trees`,
   `/docs/content-development`) so players can self-serve details.
