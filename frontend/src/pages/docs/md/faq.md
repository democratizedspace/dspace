---
title: 'Frequently Asked Questions'
slug: 'faq'
---

## What is DSPACE?

DSPACE is an incremental simulation game about practical skills, resource management, and spacefaring
readiness. Progress comes from quests, items, and processes that model real-world workflows.

## What changed in v3?

v3 introduced major upgrades:

- 10x quest growth and expanded skill trees
- In-game custom content tools for quests, items, and processes
- Local-first saves in IndexedDB with migration support for older saves
- Backup + Cloud Sync workflows
- NPC persona chat with OpenAI-backed guidance
- Live destinations for Stats, Titles, Toolbox, and Leaderboard

See [April 1, 2026 release notes](/changelog#20260401) and [v3 release state](/docs/v3-release-state).

## How do I get started?

Start with the **Welcome** quest tree, then branch into a skill tree that interests you via
[Quest Trees](/docs/quest-trees).

## How do progression systems connect?

- **Quests** unlock new skills and often grant inventory items.
- **Processes** transform items into new outputs.
- **Inventory** tracks resources, tools, and rewards.
- **Achievements and Titles** reflect milestones and unlock visible progression badges.
- **Stats** summarizes your overall account progress.

## Can I create custom content in-game?

Yes. v3 includes editors and management pages for:

- Quests: `/quests/create`, `/quests/manage`
- Items: `/inventory/create`, `/inventory/manage`
- Processes: `/processes/create`, `/processes/manage`

Use [Content Development](/docs/content-development), [Quest Submission](/docs/quest-submission), and
[Custom Content Bundles](/docs/custom-bundles) for the full workflow.

## Where is my data stored?

DSPACE stores save state and custom content locally in **IndexedDB** by default. Legacy v1/v2 save
formats can be detected and migrated through Settings.

## How do backup and restore work?

Use:

- `/gamesaves` for full game save import/export
- `/contentbackup` for custom content backups
- `/cloudsync` for encrypted GitHub Gist backups

See [Backups](/docs/backups), [Cloud Sync](/docs/cloud-sync), and
[Legacy save storage](/docs/legacy-save-storage).

## Do I need a GitHub token?

Only for GitHub-powered features such as Cloud Sync and contribution submission tooling.
Tokens are local to your browser session and can be cleared from Settings.

## What are dUSD, dWatt, dCarbon, and dOffset?

- **[dUSD](/docs/dusd):** in-game currency for pricing and trade.
- **[dWatt](/docs/dwatt):** energy production metric used across processes and systems.
- **[dCarbon](/docs/dcarbon):** emissions pressure metric tied to energy choices.
- **[dOffset](/docs/doffset):** offset metric produced by cleanup/mitigation flows.

## Are guilds fully multiplayer already?

Not yet. In v3, Guilds and Metaguild are live as destination + narrative/social framing, while full
multiplayer/federation systems remain roadmap work.

## How do I find docs quickly?

Use `/docs` search. It supports keyword search and `has:` feature filters (for example,
`has:image` or `has:table`). See [Docs search](/docs/docs-search).

## Where can I report bugs or help build?

- Discord: <https://discord.gg/A3UAfYvnxM>
- Repo: <https://github.com/democratizedspace/dspace>
- Contribution docs: [Contribute](/docs/contribute)
