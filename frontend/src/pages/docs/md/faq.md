---
title: 'Frequently Asked Questions'
slug: 'faq'
---

## What is DSPACE?

DSPACE is an incremental simulation game about resource management and space exploration. It
focuses on learning by doing through quests, processes, and real-world inspired projects. For a
full overview, start with [About](/docs/about) and the [Mission](/docs/mission).

## What changed with v3?

v3 introduced the largest docs + systems expansion so far: custom content editors (quests/items/
processes), better backup and cloud sync tooling, expanded utility routes, and broader quest
coverage. Start with [v3 Release State](/docs/v3-release-state),
[Quest Trees](/docs/quest-trees), and [Content Development](/docs/content-development).

## Is DSPACE still in development?

Yes. The game is under active development, and new quests, systems, and improvements ship
regularly. If you want to help shape what’s next, join the community on
[Discord](https://discord.gg/A3UAfYvnxM) or see the [Roadmap](/docs/roadmap).

## How do I get started?

Begin with the Welcome quest tree, which teaches the basics of accepting quests, completing
objectives, and collecting rewards. Then use [Quest Trees](/docs/quest-trees) to pick your next
skill path.

## How do I make progress?

[Quests](/quests) are the main progression system. They introduce prerequisites, rewards, and
new [processes](/docs/processes). Processes then transform items over time so you can unlock more
complex quests.

## What are quest trees?

Quest trees group related quests into themed learning paths such as energy systems, hydroponics,
robotics, and rocketry. Browse the current catalog and doc mappings on
[Quest Trees](/docs/quest-trees).

## What are processes and how do they work?

[Processes](/docs/processes) are timed activities that require and/or consume items, then create
new items. Process progress is real-time and tied to your save state.

## Where do items live and how does inventory work?

Your [inventory](/docs/inventory) holds everything you earn from quests and processes. In v3,
save data is primarily stored in IndexedDB.

## Can I create custom quests, items, or processes?

Yes. DSPACE includes in-game editors for all three:

- `/quests/create`
- `/inventory/create`
- `/processes/create`

Use the matching manage pages (`/quests/manage`, `/inventory/manage`, `/processes/manage`) for
editing and cleanup. See [Content Development](/docs/content-development) for the full workflow.

## How do I submit custom quests?

Use the [Quest Submission Guide](/docs/quest-submission) to package your quest, process, or item
for review. The guide covers export, validation, and pull request handoff.

## What are custom content bundles?

Bundles let you submit related quests, items, and processes as one JSON payload so dependencies
stay aligned. Learn the format in [Custom Content Bundles](/docs/custom-bundles).

## Where is my save data stored?

Game state and custom content are stored locally in your browser (IndexedDB primary). DSPACE does
not upload save data unless you explicitly configure [Cloud Sync](/docs/cloud-sync).

## How do I back up or restore data?

Use `/gamesaves` for game-state export/import and `/contentbackup` for custom content bundle
export/import. See [Backups](/docs/backups) and [Cloud Sync](/docs/cloud-sync).

## How does Cloud Sync work?

Cloud Sync stores encrypted backups in a private GitHub gist. You provide a GitHub token and gist
ID, and DSPACE syncs save snapshots using your configuration.

## Do I need a GitHub token?

Only for GitHub-backed features (for example, Cloud Sync and contribution workflows). Tokens are
stored locally and can be cleared at any time. See [Authentication](/docs/authentication).

## What are dUSD, dWatt, and dCarbon?

- **[dUSD](/docs/dusd)** is the in-game currency used for buying and selling.
- **[dWatt](/docs/dwatt)** tracks generated/available energy.
- **[dCarbon](/docs/dcarbon)** tracks emissions pressure from non-renewable power choices.

## How do achievements, titles, stats, and leaderboard fit together?

- `/achievements`: milestone unlocks.
- `/titles`: title progression tied to achievement completion.
- `/stats`: high-level quest/item/process totals.
- `/leaderboard`: donation-oriented ranking board.

Related references: [Achievements](/docs/achievements), [Titles](/docs/titles), and
[Routes](/docs/routes).

## Are guilds live?

Not as a full gameplay system yet. Guilds are still marked coming soon in navigation; the current
Metaguild framing is documented on [Guilds](/docs/guilds).

## How do I search docs quickly?

Use `/docs` search for title + body matches. Feature filters like `has:image` and `has:link` are
also supported. See [Docs search](/docs/docs-search).

## Can I self-host DSPACE?

Yes. Use Docker or local Node-based workflows from [Self-hosting](/docs/self-hosting).

## Where can I learn more?

Explore [docs](/docs), join [Discord](https://discord.gg/A3UAfYvnxM), and review
[Contribute](/docs/contribute).
