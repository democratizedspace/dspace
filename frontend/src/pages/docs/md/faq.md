---
title: 'Frequently Asked Questions'
slug: 'faq'
---

## What is DSPACE?

DSPACE is an incremental simulation game about practical systems thinking: quests teach real-world
workflows, processes transform resources over time, and your inventory reflects what you can build.
Start with [About](/docs/about) and [Mission](/docs/mission).

## What changed in v3?

v3 is the largest systems update so far. Highlights include:

- In-game custom content editors for quests, items, and processes.
- Local-first saves in IndexedDB with migration paths from legacy v1/v2 saves.
- Save safety utilities (`/gamesaves`, `/cloudsync`, `/contentbackup`).
- Expanded progression routes including `/stats`, `/titles`, `/leaderboard`, and `/toolbox`.
- Docs/search improvements and a much larger quest catalog.

Reference pages: [v3 Release State](/docs/v3-release-state),
[Quest Trees](/docs/quest-trees), [Content Development](/docs/content-development).

## Is DSPACE still in development?

Yes. v3 is live, and content/system updates continue. See [Roadmap](/docs/roadmap),
[Changelog](/changelog), and [Contribute](/docs/contribute).

## How should new players start?

1. Complete the Welcome quests.
2. Pick one practical tree from [Quest Trees](/docs/quest-trees).
3. Use [Processes](/docs/processes) to convert resources for your next quest gates.
4. Watch progress in `/stats`, `/achievements`, and `/titles`.

## How does progression work?

Quests unlock via `requiresQuests` dependencies and item/process gates. Completing them grants
rewards (items/currency) and opens additional trees.

## What are processes?

Processes are timed transformations with `requires`, `consumes`, and `creates` item relationships.
See [Processes](/docs/processes) and [Process Guidelines](/docs/process-guidelines).

## Where are saves stored in v3?

Primary save storage is IndexedDB. Legacy v1 cookies and v2 localStorage saves can be imported
through Settings migration tooling. See [Backups](/docs/backups),
[Legacy Save Storage](/docs/legacy-save-storage), and [Cloud Sync](/docs/cloud-sync).

## Can I make custom quests/items/processes?

Yes.

- Create: `/quests/create`, `/inventory/create`, `/processes/create`
- Manage: `/quests/manage`, `/inventory/manage`, `/processes/manage`
- Backup/export/import: `/contentbackup`

Start here: [Content Development](/docs/content-development).

## How does cloud sync work?

Cloud sync uses a GitHub gist token flow and can upload/download both game state and custom
content. Credentials are stored locally so you can reuse them without re-entry. See
[Cloud Sync](/docs/cloud-sync).

## Are guilds playable in v3?

Not as a full game system. The menu entry is still coming soon, but guild-style community framing
and social progression signals are reflected through docs plus `/leaderboard`.
See [Guilds](/docs/guilds).

## Is token.place live in v3?

token.place integration exists in code paths but is deferred for player-facing use in v3.
Track status on [token.place](/docs/token-place).

## Where do I track what changed and what is validated?

- Release notes: [Changelog](/changelog)
- Ship-state snapshot: [v3 Release State](/docs/v3-release-state)
- QA verification checklist: [docs/qa/v3.md](https://github.com/democratizedspace/dspace/blob/v3/docs/qa/v3.md)
