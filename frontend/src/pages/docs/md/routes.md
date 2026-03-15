---
title: 'Routes'
slug: 'routes'
---

# DSPACE Routes (v3)

This page documents the canonical in-app route surface for v3.

It is aligned to `docs/ROUTES.md` and the active menu configuration.

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

External links in More: Discord, Twitter, GitHub.

## Custom content authoring + management routes

### Quests

- `/quests/create`
- `/quests/manage`
- `/quests/:id/edit`
- `/quests/:pathId/:questId`
- `/quests/:pathId/:questId/edit`
- `/quests/:pathId/:questId/finished`

### Items

- `/inventory/create`
- `/inventory/manage`
- `/inventory/item/:itemId`
- `/inventory/item/:itemId/edit`

### Processes

- `/processes/create`
- `/processes/manage`
- `/processes/:processId`
- `/processes/:processId/edit`

## High-use utility routes

- `/gamesaves` — game save import/export
- `/cloudsync` — cloud backup config + sync controls
- `/contentbackup` — custom content backup import/export
- `/settings` — preferences, auth/token controls, migration tools
- `/toolbox` — utilities and diagnostics entrypoint

## Documentation routes

- `/docs` — docs landing + search
- `/docs/:slug` — docs detail pages (for example `/docs/about`, `/docs/quest-trees`)

## Link checking

Internal markdown links are validated by `scripts/link-check.mjs` without starting the dev server.

```bash
node scripts/link-check.mjs
```

## Canonical source and contribution note

If this page conflicts with a route currently served by Astro, update both:

1. `docs/ROUTES.md`
2. this page (`/docs/routes`)
