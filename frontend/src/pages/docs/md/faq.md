---
title: 'Frequently Asked Questions'
slug: 'faq'
---

## What can I do?

There are a variety of quests to complete. Quests are the primary way to learn about the lore and
mechanics of the game. If you're all caught up, try building your own adventure with the
[custom quest system](/docs/custom-quest-system) or replay story arcs to see the alternate
outcomes hidden behind optional objectives.

## How do I submit custom quests?

Use the [Quest Submission Guide](/docs/quest-submission) to package your quest, process, or item
so it can be reviewed for inclusion in the canon game. The guide walks through exporting your
content, generating screenshots, and opening a pull request directly from the in-game tools.

## Where is my progress stored?

Your save data (quests, inventory, processes, and custom content) lives locally in IndexedDB. The
[Inventory](/docs/inventory) guide covers how items persist, and the [Legacy saves & storage
migrations](/docs/legacy-save-storage) page explains how older formats are upgraded.

## How do I back up or restore my save?

Use the [Backups](/docs/backups) guide to export a Base64-encoded gamesave from
[/gamesaves](/gamesaves) or a custom-content-only backup from [/contentbackup](/contentbackup).
You can import the saved string on any device to restore progress.

## How does Cloud Sync work?

[Cloud Sync](/docs/cloud-sync) uploads encrypted save snapshots to a private GitHub gist. You
provide a token with `gist` scope, then use **Upload** and **Download** to sync between devices.

## Why do I need a GitHub token?

GitHub tokens are required for features that interact with GitHub directly, such as quest
submissions and Cloud Sync. The [Authentication Flow](/docs/authentication) explains required
scopes and how tokens are stored in IndexedDB for convenience.

## How do I make progress?

[Quests](/docs/quest-guidelines) are the primary way to make progress in the game. They can grant
certain items and introduce you to [processes](/docs/processes).

## How do processes work?

Processes are timed recipes that convert required or consumed items into new items. The
[Processes](/docs/processes) page explains the lifecycle (not started → in progress → finished),
what happens when you cancel a process, and how durations are formatted.

## Where do I manage my inventory?

The [Inventory](/docs/inventory) doc explains item types, relationships, and how the `/inventory`
page groups items into filterable categories that are sourced from item JSON data.

## Can I create custom items and processes?

Yes. Use the in-game editors at [/inventory/create](/inventory/create) and
[/processes/create](/processes/create), then manage your entries at
[/inventory/manage](/inventory/manage) and [/processes/manage](/processes/manage). The
[Item Development Guidelines](/docs/item-guidelines) and [Process Development Guidelines]
(/docs/process-guidelines) cover best practices.

## What is the custom quest system?

The [Custom Quest System](/docs/custom-quest-system) describes the in-game editor that lets you
build quests with branching dialogue, preview them live, and submit them for review without
hand-writing JSON.

## How do I submit a bundle of quests, items, and processes?

[Custom Content Bundles](/docs/custom-bundles) keep related content together. You can export
custom content from [/contentbackup](/contentbackup), package it into a bundle JSON, and submit it
at [/bundles/submit](/bundles/submit) to open a pull request.

## Where can I see achievements and titles?

Visit [/achievements](/achievements) to track milestones and [/titles](/titles) or your
[/profile](/profile) to see earned titles. The [Achievements](/docs/achievements) and
[Titles](/docs/titles) pages list the current rewards.

## What are guilds?

[Guilds](/docs/guilds) are collaborative crews that pool equipment, quests, and funding. The
Metaguild is the flagship guild and connects to the [Leaderboard](/leaderboard) and
[Stats](/stats) views for shared progress.

## Can I self-host DSPACE?

Yes. The [Self-hosting DSPACE](/docs/self-hosting) guide walks through running the site with
Docker Compose, plus links to advanced deployment guides.

## What are processes and how do they work?

[Processes](/docs/processes) are something you can do to convert one or more items into other
items. This is the primary way to create items in the game.

## Where can I learn more?

On the [Discord](https://discord.gg/A3UAfYvnxM) or here in the [docs](/docs).
