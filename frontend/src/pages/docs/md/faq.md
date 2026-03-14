---
title: 'Frequently Asked Questions'
slug: 'faq'
---

## What is DSPACE?

DSPACE is a local-first incremental simulation game focused on practical skills that support long-
term space exploration. See [About](/docs/about) and [Mission](/docs/mission).

## Is v3 live?

Yes. v3 shipped with expanded quests, custom content tooling, updated docs navigation, and new live
menu destinations. See [changelog](/changelog#20260401).

## How much content is there now?

v3 includes **248 official quests** across 19 quest trees. See [Quest Trees](/docs/quest-trees)
and [New Quests](/docs/new-quests).

## How do I get started?

Start with the [Welcome](/docs/welcome) quest path, then branch into skill trees using
[Quest Trees](/docs/quest-trees).

## Where are saves stored?

Saves and custom content are stored in IndexedDB on your device. DSPACE only sends data externally
if you explicitly use [Cloud Sync](/docs/cloud-sync).

## How do I back up or restore data?

Use [/gamesaves](/gamesaves) for save export/import and [/contentbackup](/contentbackup) for custom
content backups. See [Backups](/docs/backups).

## Can I create custom content?

Yes. v3 includes in-game editors:

- Quests: [/quests/create](/quests/create)
- Items: [/inventory/create](/inventory/create)
- Processes: [/processes/create](/processes/create)

See [Content Development Guide](/docs/content-development).

## How do I submit custom content to the main game?

Use [Quest Submission Guide](/docs/quest-submission) and [Custom Content Bundles](/docs/custom-bundles). Bundles let you submit quests/items/processes together via [/bundles/submit](/bundles/submit).

## Do I need a GitHub token?

Only for GitHub-backed features (for example Cloud Sync or submission helpers). Tokens are stored
locally and can be cleared in Settings. See [Authentication](/docs/authentication).

## What are Stats, Titles, Toolbox, and Leaderboard?

They are live v3 destinations:

- [Stats](/docs/stats): progress and completion summaries
- [Titles](/docs/titles): prestige ranks tied to achievements
- [Toolbox](/docs/toolbox): utilities hub (saves, backups, diagnostics)
- [Leaderboard](/docs/leaderboard): in-game donation board

## Are guilds multiplayer yet?

Not fully. v3 has a live Metaguild social framing and leaderboard presence, but guild membership,
co-op progression, and federation are still roadmap items. See [Guilds](/docs/guilds).

## How do I search docs quickly?

Use the `/docs` search bar. It supports instant filtering and query operators like `has:image`.
See [Docs Search](/docs/docs-search).

## Can I self-host DSPACE?

Yes. See [Self-hosting](/docs/self-hosting) for Docker and deployment guidance.
