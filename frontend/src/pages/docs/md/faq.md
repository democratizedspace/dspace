---
title: 'Frequently Asked Questions'
slug: 'faq'
---

## What can I do?

There are a variety of quests to complete. Quests are the primary way to learn about the lore and
mechanics of the game. If you're all caught up, try building your own adventure with the
[custom quest system](/docs/custom-quest-system) or replay story arcs to see the alternate
outcomes hidden behind optional objectives.

## What is DSPACE?

DSPACE is an incremental simulation game about resource management and space exploration. It is
designed as a learning platform where you complete quests, gain skills, and build a virtual
presence in the solar system. Learn more in the [About](/docs/about) page.

## Is DSPACE still in development?

Yes. The project is under active development, and the team shares updates through the
[roadmap](/docs/roadmap) and community channels like [Discord](https://discord.gg/A3UAfYvnxM).

## How do I submit custom quests?

Use the [Quest Submission Guide](/docs/quest-submission) to package your quest, process, or item
so it can be reviewed for inclusion in the canon game. The guide walks through exporting your
content, generating screenshots, and opening a pull request directly from the in-game tools.

## How do I create custom quests without editing JSON?

Use the in-game editor described in the [Custom Quest System](/docs/custom-quest-system). It lets
you build dialogue, add options, preview the quest, validate against the schema, and submit a pull
request when you're ready.

## Can I create custom items and processes?

Yes. Use the in-game editors to build new items and processes. The
[Item Development Guidelines](/docs/item-guidelines) and
[Process Development Guidelines](/docs/process-guidelines) explain required fields, validation
rules, and best practices.

## How do I make progress?

[Quests](/docs/quest-guidelines) are the primary way to make progress in the game. They can grant
certain items and introduce you to [processes](/docs/processes).

## What are processes and how do they work?

[Processes](/docs/processes) are something you can do to convert one or more items into other
items. This is the primary way to create items in the game.

## How do I manage custom quests, items, and processes?

Use the built-in management pages to review or edit your custom content:

- Quests: [/quests/manage](/quests/manage)
- Items: [/inventory/manage](/inventory/manage)
- Processes: [/processes/manage](/processes/manage)

These pages let you preview, edit, or remove your local creations.

## Where is my progress stored?

Game state (quests, inventory, processes) and custom content are stored locally in your browser
storage (IndexedDB). Use the [Backups guide](/docs/backups) if you want to export or restore your
data across devices.

## How do I back up my save data?

You can export your full game save at [/gamesaves](/gamesaves) or export just custom content at
[/contentbackup](/contentbackup). Both produce Base64-encoded JSON that you can store safely and
re-import later. See the full [Backups guide](/docs/backups) for step-by-step instructions.

## What is Cloud Sync and what does it store?

[Cloud Sync](/docs/cloud-sync) backs up your game state and custom content to a private GitHub
gist. It runs in the background once configured and keeps your data available across devices.

## How do I authenticate for quest submissions or Cloud Sync?

DSPACE uses GitHub personal access tokens for features that interact with the official repository.
Generate a token with `repo` and `gist` scopes, save it in the in-game settings, and it will be
stored locally in IndexedDB. See the [Authentication Flow](/docs/authentication) for details.

## How do I log out or clear my saved token?

Open the **Settings** page and click **Log out** to clear the saved GitHub token and Cloud Sync
gist ID from the device. This removes access to synced data until you sign in again.

## What are achievements and titles?

Achievements mark milestone progress (like completing quests or earning energy items), and titles
are the long-term ranks tied to those achievements. Track them in
[/achievements](/achievements) and [/titles](/titles).

## Can I self-host DSPACE?

Yes. Use Docker Compose to run your own instance locally. The
[Self-hosting guide](/docs/self-hosting) lists requirements, commands, and helpful scripts.

## How can I contribute or report issues?

Join the community on [Discord](https://discord.gg/A3UAfYvnxM) or review the
[Contribute](/docs/contribute) page for ways to submit content, report bugs, or open code pull
requests.

## Where can I learn more?

On the [Discord](https://discord.gg/A3UAfYvnxM) or here in the [docs](/docs).
