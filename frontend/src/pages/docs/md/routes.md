---
title: 'Routes'
slug: 'routes'
---

# DSPACE Routes

This page lists canonical in-app routes and click paths for v3.
It mirrors `docs/ROUTES.md` and `frontend/src/config/menu.json`.

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

External links: Discord, Twitter, and GitHub open off-site.

## Authoring + management entry points

- Quests: `/quests/create`, `/quests/manage`, `/quests/:id/edit`
- Items: `/inventory/create`, `/inventory/manage`, `/inventory/item/:itemId/edit`
- Processes: `/processes/create`, `/processes/manage`, `/processes/:processId/edit`

## Core static pages

- Settings/utility: `/settings`, `/stats`, `/toolbox`, `/gamesaves`, `/cloudsync`, `/contentbackup`
- Social/meta: `/leaderboard`, `/titles`, `/achievements`, `/profile`
- Chat/debug: `/chat`, `/dchat`, `/debug`

## Dynamic route patterns

- Docs: `/docs/:slug`
- Quest detail: `/quests/:pathId/:questId` (and `/edit`, `/finished` variants)
- Process detail: `/processes/:processId`
- Inventory detail: `/inventory/item/:itemId`
- Shop flows: `/shop/buy/:itemId/:count`, `/shop/sell/:itemId/:count`, error variants

## Link-checking behavior

Internal markdown links are validated by `scripts/link-check.mjs` without starting the dev server.
Dynamic segments are resolved against Astro file routes.

Run from repo root:

```bash
node scripts/link-check.mjs
```

## Common click paths

- More → Processes opens /processes.
- More → Import/export gamesaves opens /gamesaves.
- More → Cloud Sync opens /cloudsync.
- More → Custom Content Backup opens /contentbackup.
- More → Guilds is marked Coming soon (no navigation yet).
- More → Stats opens /stats.
- More → Achievements opens /achievements.
- More → Leaderboard opens /leaderboard.
- More → Locations is marked Coming soon (no navigation yet).
- More → Titles opens /titles.
- More → Toolbox opens /toolbox.
- More → Settings opens /settings.
- More → Discord opens https://discord.gg/A3UAfYvnxM.
- More → Twitter opens https://twitter.com/dspacegame.
- More → Github opens https://github.com/democratizedspace/dspace.
- Quests page → Manage button opens /quests/manage.
- Quests manage page → Create button opens /quests/create.
- Inventory page → Manage button opens /inventory/manage.
- Inventory manage page → Create button opens /inventory/create.
- Processes page → Manage button opens /processes/manage.
- Processes manage page → Create button opens /processes/create.
