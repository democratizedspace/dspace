---
title: 'v3 Release State'
slug: 'v3-release-state'
---

# v3 Release State

This page is the player-facing source of truth for what is live in v3 and what is intentionally
deferred. It is maintained against:

- [April 1, 2026 changelog](/changelog#20260401)
- [v3 QA checklist](https://github.com/democratizedspace/dspace/blob/v3/docs/qa/v3.md)
- [Routes catalog](/docs/routes)

## Fully live in v3

### Core gameplay loops

- Quest, inventory, and process systems are live and integrated.
- Quest trees include Welcome, hardware, energy, life-support, and systems tracks.
- Achievements and title progression update from real save data.

### Utility destinations now live

The More menu now includes live pages for:

- `/processes`
- `/gamesaves`
- `/cloudsync`
- `/contentbackup`
- `/stats`
- `/achievements`
- `/leaderboard`
- `/titles`
- `/toolbox`
- `/settings`

### Custom content tooling (headline v3 feature)

- In-game create/manage flows for quests, items, and processes are live.
- Custom content can be exported/imported as bundles through `/contentbackup`.
- Submission workflow docs and PR-oriented handoff flows are live.

### Save safety and migration

- IndexedDB is the primary persistence layer.
- Legacy v1 (cookies) and v2 (localStorage) migration controls are available in Settings.
- Manual backup routes plus cloud sync are available for risk reduction before major edits.

### AI chat

- `/chat` ships with selectable NPC personas.
- v3 supports OpenAI-only provider flows.
- token.place integration exists in code but is deferred from v3 runtime.

## Deferred or intentionally limited in v3

### Guild mechanics

- `/guilds` remains coming soon.
- Narrative/community framing exists today (Metaguild + leaderboard surfaces), but not full guild
  entity mechanics (membership, shared inventory, guild-scoped progression).

### Locations destination

- `/locations` is still listed as coming soon.

### token.place runtime integration

- Deferred to a post-v3 release window.
- See [token.place](/docs/token-place) for current expectations.

## Deprecated v2 assumptions

- LocalStorage is no longer primary state storage.
- Web3 framing is removed from core progression expectations.
- Legacy artifacts are migration input, not canonical runtime state.

## Docs maintenance checklist

When updating gameplay docs for v3+, verify each claim against current routes/tests:

1. The linked route is reachable and not marked coming soon.
2. The behavior is represented in changelog and/or QA references.
3. Partial systems clearly document what is live vs deferred.
4. Related canonical docs are linked (Routes, Quest Trees, Content Development).
