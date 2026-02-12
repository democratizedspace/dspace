---
title: 'Frequently Asked Questions'
slug: 'faq'
---

## What is DSPACE?

DSPACE is an incremental simulation game about resource management and space exploration. It
focuses on learning by doing through quests, processes, and real-world inspired projects. For a
full overview, start with [About](/docs/about) and the [Mission](/docs/mission).

## Is DSPACE still in development?

Yes. The game is under active development, and new quests, systems, and improvements ship
regularly. If you want to help shape what’s next, join the community on
[Discord](https://discord.gg/A3UAfYvnxM) or see the [Roadmap](/docs/roadmap).

## How do I get started?

Begin with the Welcome quest tree, which teaches the basics of accepting quests, completing
objectives, and collecting rewards. The [Quest Trees](/docs/quest-trees) page lists every quest
line so you can pick the next path once the tutorial is complete.

## What can I do?

There are a variety of quests to complete. Quests are the primary way to learn about the lore and
mechanics of the game. If you're all caught up, try building your own adventure with the
[custom quest system](/docs/custom-quest-system) or replay story arcs to see the alternate
outcomes hidden behind optional objectives.

## How do I make progress?

[Quests](/docs/quest-guidelines) are the primary way to make progress in the game. They can grant
certain items and introduce you to [processes](/docs/processes).

## What are quest trees?

Quest trees group related quests into themed learning paths such as 3D printing, energy systems,
hydroponics, and rocketry. Browse the full catalog on the [Quest Trees](/docs/quest-trees) page to
find a topic that interests you.

## What are processes and how do they work?

[Processes](/docs/processes) are something you can do to convert one or more items into other
items. This is the primary way to create items in the game.

## Where do items live and how does inventory work?

Your [inventory](/docs/inventory) holds everything you earn from quests and processes. Items are
stored locally in IndexedDB, grouped into categories, and can be filtered or inspected in detail
from the `/inventory` page.

## Can I create custom quests, items, or processes?

Yes. DSPACE includes in-game editors for all three: `/quests/create`, `/inventory/create`, and
`/processes/create`. Edits are stored locally and can be managed from `/quests/manage`,
`/inventory/manage`, and `/processes/manage`. See the
[Content Development Guide](/docs/content-development) for the full workflow.

## How do I submit custom quests?

Use the [Quest Submission Guide](/docs/quest-submission) to package your quest, process, or item
so it can be reviewed for inclusion in the canon game. The guide walks through exporting your
content, generating screenshots, and opening a pull request directly from the in-game tools.

## What are custom content bundles?

Bundles let you submit related quests, items, and processes together as one JSON file so they stay
in sync. Learn the format and submission flow in [Custom Content Bundles](/docs/custom-bundles).

## Where is my save data stored?

Game state, custom content, achievements, and tokens are stored locally in your browser using
IndexedDB. DSPACE does not send your data to a server unless you explicitly enable
[Cloud Sync](/docs/cloud-sync).

## How do I back up or restore my data?

Use the export tools described in [Backups](/docs/backups) to copy a Base64 snapshot of your
gamesave or custom content. You can restore by pasting the saved string into the matching import
screen.

## How does Cloud Sync work?

Cloud Sync stores encrypted backups in a private GitHub gist. You supply a GitHub token and gist
ID in the Settings page, and DSPACE uploads changes automatically. Details are in
[Cloud Sync](/docs/cloud-sync).

## Do I need a GitHub token?

A GitHub token is required only for features that interact with GitHub, such as submitting quests
or using Cloud Sync. Tokens are stored locally and can be cleared at any time. See the
[Authentication Flow](/docs/authentication) for setup and security notes.

## How do I log out or clear my token?

Open the Settings page and click **Log out** to clear the saved GitHub token and any Cloud Sync
ID. You can also use the **Clear** button next to the token input field. See
[Authentication Flow](/docs/authentication) for details.

## What are dUSD, dWatt, and dCarbon?

- **[dUSD](/docs/dusd)** is the in-game currency used for buying and selling.
- **[dWatt](/docs/dwatt)** tracks energy generation used to power processes.
- **[dCarbon](/docs/dcarbon)** tracks emissions produced by non-renewable power sources.

## How do energy sources affect the economy?

Generating power from fossil-fuel outlets increases dCarbon. Selling any priced item is taxed by
`dCarbon / 1000` percent (continuous, capped at 90%), and dWatt itself is not sold, so renewable
energy like [solar power](/docs/solar) or wind turbines is the best long-term strategy. See
[Electricity](/docs/electricity) for the full rules.

## How do I reduce dCarbon?

Run the **dCarbon to dOffset** process to convert accumulated dCarbon into dOffset. The process
consumes dCarbon and a small amount of dUSD, lowering your emissions footprint. See
[dCarbon](/docs/dcarbon).

## Where can I track achievements and titles?

Achievements live on `/achievements` and update as you finish quests or collect items. Titles are
tied to achievements and appear on `/titles` and your [profile](/profile). See
[Achievements](/docs/achievements) and [Titles](/docs/titles).

## What are guilds and the Metaguild?

Guilds are a planned multiplayer feature (2027+ on the roadmap). Once ActivityPub integration
lands, players will be able to form guilds, coordinate shared progress, and unlock guild-specific
content. The Metaguild will be the flagship guild, but it is not available yet. See
[Guilds](/docs/guilds) for the current plan.

## How do I search the docs?

Use the search box on `/docs` to find pages by title or content. Searches also support `has:`
filters (for example, `has:image`). See [Docs search](/docs/docs-search).

## Can I self-host DSPACE?

Yes. DSPACE provides a Docker Compose setup for running the game locally. See
[Self-hosting DSPACE](/docs/self-hosting) for the quick-start guide and advanced deployment links.

## Where can I learn more?

On the [Discord](https://discord.gg/A3UAfYvnxM) or here in the [docs](/docs). You can also explore
the [Contribution Guide](/docs/contribute) and [Developer Resources](/docs/developer-resources).
