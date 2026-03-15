---
title: 'Frequently Asked Questions'
slug: 'faq'
---

## What is DSPACE?

DSPACE is an incremental learning/simulation game focused on resource systems, practical skills,
and quest-based progression. Start with [About](/docs/about) and [Mission](/docs/mission).

## What is new in v3?

v3 introduced:

- custom content creation (quests, items, processes)
- local-first IndexedDB saves with migration and backup flows
- expanded utility pages (`/stats`, `/titles`, `/toolbox`, `/settings`, `/leaderboard`)
- broader quest coverage and docs infrastructure updates

Recommended overview docs:

- [v3 Release State](/docs/v3-release-state)
- [Quest Trees](/docs/quest-trees)
- [Content Development](/docs/content-development)

## How do I start playing?

Open [Quests](/quests), complete the Welcome tree, then pick a follow-up path from
[Quest Trees](/docs/quest-trees).

## How does progression work?

1. Complete quests to unlock prerequisites and rewards.
2. Use inventory items and processes to satisfy future quest gates.
3. Expand into specialized trees (energy, hydroponics, programming, etc.).

References: [Processes](/docs/processes), [Inventory](/docs/inventory).

## Can I create custom content?

Yes. v3 has in-game editors for all core content types:

- Quests: `/quests/create`
- Items: `/inventory/create`
- Processes: `/processes/create`

Use `/quests/manage`, `/inventory/manage`, and `/processes/manage` to maintain custom entries.

## How do I submit custom content?

Use:

- [Quest Submission Guide](/docs/quest-submission)
- [Custom Content Bundles](/docs/custom-bundles)

## Where is save data stored?

v3 primarily stores game state and custom content in IndexedDB.

## How do backups work?

- `/gamesaves`: game-state import/export
- `/contentbackup`: custom content bundle import/export
- `/cloudsync`: optional encrypted backup flow via private GitHub gist

See [Backups](/docs/backups) and [Cloud Sync](/docs/cloud-sync).

## Do I need a GitHub token?

Only for GitHub-backed features (cloud sync and some contribution flows). Tokens are stored
locally and can be cleared from Settings.

## Are guilds fully live?

Not yet. Guild framing and destination links exist, but full guild gameplay is still planned.
See [Guilds](/docs/guilds).

## Is token.place required in v3?

No. v3 ships OpenAI-first chat. token.place remains feature-gated and optional.
See [token.place status](/docs/token-place).

## What are dUSD, dWatt, and dCarbon?

- [dUSD](/docs/dusd): in-game currency for buying/selling
- [dWatt](/docs/dwatt): generated/available energy
- [dCarbon](/docs/dcarbon): emissions pressure signal

## How do stats, achievements, titles, and leaderboard connect?

- `/stats`: aggregate progress
- `/achievements`: milestone unlocks
- `/titles`: rank/title progression
- `/leaderboard`: donor/recognition board

## How do I browse docs quickly?

Use `/docs` search and browse routes from [Routes](/docs/routes).

## Can I self-host DSPACE?

Yes. Start with [Self-hosting](/docs/self-hosting).
