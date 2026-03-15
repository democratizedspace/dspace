---
title: 'Routes'
slug: 'routes'
---

# DSPACE Routes (v3)

This page lists canonical player-facing routes for v3 and mirrors the runtime menu config.
Use this as the docs-facing companion to `docs/ROUTES.md`.

## Top navigation (pinned)

| UI label  | Route        |
| --------- | ------------ |
| Home      | `/`          |
| Quests    | `/quests`    |
| Inventory | `/inventory` |
| Energy    | `/energy`    |
| Wallet    | `/wallet`    |
| Profile   | `/profile`   |
| Docs      | `/docs`      |
| Chat      | `/chat`      |
| Changelog | `/changelog` |

## More menu (unpinned)

| UI label                | Route            | Status      |
| ----------------------- | ---------------- | ----------- |
| Processes               | `/processes`     | live        |
| Import/export gamesaves | `/gamesaves`     | live        |
| Cloud Sync              | `/cloudsync`     | live        |
| Custom Content Backup   | `/contentbackup` | live        |
| Guilds                  | `/guilds`        | coming soon |
| Stats                   | `/stats`         | live        |
| Achievements            | `/achievements`  | live        |
| Leaderboard             | `/leaderboard`   | live        |
| Locations               | `/locations`     | coming soon |
| Titles                  | `/titles`        | live        |
| Toolbox                 | `/toolbox`       | live        |
| Settings                | `/settings`      | live        |

External links in the More menu:

- Discord → `https://discord.gg/A3UAfYvnxM`
- Twitter → `https://twitter.com/dspacegame`
- GitHub → `https://github.com/democratizedspace/dspace`

## Content authoring and management routes

- Quests: `/quests/create`, `/quests/manage`, `/quests/:pathId/:questId`, `/quests/:id/edit`
- Items: `/inventory/create`, `/inventory/manage`, `/inventory/item/:itemId/edit`
- Processes: `/processes/create`, `/processes/manage`, `/processes/:processId/edit`
- Bundles: `/bundles/submit`

## Utility routes and diagnostics

- Save portability: `/gamesaves`, `/cloudsync`, `/contentbackup`
- Progress visibility: `/stats`, `/achievements`, `/titles`, `/leaderboard`
- Configuration/tools: `/settings`, `/toolbox`
- Debug: `/debug`

## Dynamic route patterns

- Docs: `/docs/:slug`
- Quest detail: `/quests/:pathId/:questId`
- Quest completion view: `/quests/:pathId/:questId/finished`
- Process detail: `/processes/:processId`
- Inventory detail: `/inventory/item/:itemId`
- Shop flow: `/shop/buy/:itemId/:count`, `/shop/sell/:itemId/:count`

## Link-checking behavior

Internal markdown links are validated by `scripts/link-check.mjs` without starting the dev server.
Dynamic segments are resolved against Astro file routes.

```bash
node scripts/link-check.mjs
```
