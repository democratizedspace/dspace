---
title: 'Frequently Asked Questions'
slug: 'faq'
---

## What is DSPACE?

DSPACE is an incremental simulation game about resource management and space exploration. It
focuses on learning-by-doing through quests, processes, and real-world inspired projects. Start
with [About](/docs/about), [Mission](/docs/mission), and [Welcome](/docs/welcome).

## What changed with v3?

v3 introduced the largest systems + content update so far:

- full custom content editing (quests/items/processes)
- custom content bundle export/import and submission tooling
- stronger save safety (IndexedDB + migration + backup flows)
- expanded utility pages (`/stats`, `/titles`, `/toolbox`, `/settings`, etc.)
- much larger official quest catalog

See [v3 Release State](/docs/v3-release-state), [Quest Trees](/docs/quest-trees), and
[Content Development](/docs/content-development).

## Is DSPACE still in development?

Yes. DSPACE is under active development and regularly ships new quests, systems, and UX
improvements. Track progress via [Roadmap](/docs/roadmap) and [Changelog](/docs/changelog).

## How do I get started?

Follow the Welcome quest tree first. Then choose one skill path from
[Quest Trees](/docs/quest-trees) and build from there.

## How do quests, items, and processes fit together?

- **Quests** unlock progression, rewards, and requirements.
- **Items** are inputs, outputs, and rewards.
- **Processes** transform items over real time.

Read [Inventory](/docs/inventory) and [Processes](/docs/processes) for mechanics details.

## Can I create custom quests, items, or processes?

Yes. v3 includes in-game editors for all three:

- `/quests/create`
- `/inventory/create`
- `/processes/create`

Manage custom content at `/quests/manage`, `/inventory/manage`, and `/processes/manage`.

## How do I back up and restore data?

Use both backup paths:

- `/gamesaves` for full game-state import/export
- `/contentbackup` for custom content bundle import/export

Optional automation is available at `/cloudsync`. See [Backups](/docs/backups).

## What are custom content bundles?

Bundles combine custom quests, items, and processes into one JSON payload so dependencies stay
aligned. See [Custom Content Bundles](/docs/custom-content-bundles).

## Do I need GitHub credentials?

Only for GitHub-connected features (bundle submission and cloud sync). See
[Authentication](/docs/authentication) for scope requirements and storage behavior.

## Where is data stored?

Primary v3 storage is IndexedDB. Legacy localStorage/cookies are treated as migration sources.

## What are dUSD, dWatt, and dCarbon?

- [dUSD](/docs/dusd): in-game value/currency unit.
- [dWatt](/docs/dwatt): energy accounting unit.
- [dCarbon](/docs/dcarbon): carbon/emissions accounting unit.

## Are guilds and locations playable yet?

Not fully. `/guilds` and `/locations` remain menu placeholders marked coming soon.

## Where can I see all major pages and routes?

Use [Routes](/docs/routes) and [Utility Surfaces](/docs/utility-surfaces).

## Where can I get help or contribute?

- Read [Contribute](/docs/contribute)
- Join [Discord](https://discord.gg/A3UAfYvnxM)
- For content contributions, start at [Quest Submission Guide](/docs/quest-submission)
