---
title: 'Frequently Asked Questions'
slug: 'faq'
---

## What is DSPACE?

DSPACE is an incremental simulation game about resource management and practical systems for space
exploration. You progress by completing quests, managing inventory, and running timed processes.
Start with [About](/docs/about) and [Mission](/docs/mission) for the big picture.

## What changed in v3?

v3 introduced the largest gameplay and docs update so far:

- in-game custom content editors for quests, items, and processes
- IndexedDB-first save storage with legacy migration tooling
- backup/sync utilities (`/gamesaves`, `/contentbackup`, `/cloudsync`)
- expanded utility destinations (`/stats`, `/toolbox`, `/titles`, `/leaderboard`, `/settings`)
- NPC persona chat flows in `/chat` (OpenAI-only in v3)

Use [v3 Release State](/docs/v3-release-state) for the canonical live-vs-deferred breakdown.

## Is DSPACE still in development?

Yes. v3 is live, and development continues. Track changes on [Changelog](/docs/changelog) and
planned work on [Roadmap](/docs/roadmap).

## How should new players start?

Start with the Welcome quests, then choose one or two trees from [Quest Trees](/docs/quest-trees).
Good first combinations are:

- Energy + Electronics (hardware foundations)
- Hydroponics + Composting (life-support loops)
- Programming + DevOps (automation foundations)

## How does progression work?

Progression is primarily quest-driven:

1. Complete [Quests](/quests)
2. Earn items and unlock [Processes](/processes)
3. Use process outputs and new items to unlock later quests

Use [Stats](/docs/stats) to see live catalog counts and [Inventory](/docs/inventory) to understand
item categories.

## Can I create custom content?

Yes. v3 includes in-game editors and management routes:

- Quests: `/quests/create`, `/quests/manage`
- Items: `/inventory/create`, `/inventory/manage`
- Processes: `/processes/create`, `/processes/manage`

Read [Content Development](/docs/content-development) before publishing bundles.

## How do I submit custom content for review?

Use the [Quest Submission Guide](/docs/quest-submission). For multi-asset contributions, export a
bundle and follow [Custom Content Bundles](/docs/custom-bundles).

## Where is my data stored?

v3 stores game state and custom content locally in IndexedDB. Legacy cookie/localStorage data can
be imported through migration tools in [Settings](/docs/settings).

## How do backups work?

- `/gamesaves` exports/imports full game state snapshots
- `/contentbackup` exports/imports custom quest/item/process bundles
- `/cloudsync` syncs encrypted snapshots via private GitHub gists (optional)

Details: [Backups](/docs/backups) and [Cloud Sync](/docs/cloud-sync).

## Do I need a GitHub token?

Only for GitHub-backed features like Cloud Sync and some contribution flows. Tokens are stored
locally and removable from Settings. See [Authentication](/docs/authentication).

## What are dUSD, dWatt, and dCarbon?

- [dUSD](/docs/dusd): in-game money for buy/sell flows
- [dWatt](/docs/dwatt): energy reserve metric
- [dCarbon](/docs/dcarbon): emissions pressure metric

These are game systems in v3, not on-chain assets.

## Are guilds fully implemented?

Not yet. `/guilds` remains a coming-soon destination. v3 includes Metaguild framing and a live
leaderboard surface, but not full guild membership/inventory mechanics.

## Where can I find route-level documentation?

Use [Routes](/docs/routes) for canonical click paths and route patterns, and [Toolbox](/docs/toolbox)
for a utility-focused entry point.
