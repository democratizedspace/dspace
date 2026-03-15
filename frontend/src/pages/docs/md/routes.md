---
title: 'Routes'
slug: 'routes'
---

# DSPACE Routes (v3)

This page documents the in-app route surface for v3 and mirrors `frontend/src/config/menu.json`
plus `docs/ROUTES.md`.

## Top navigation (pinned)

| UI label  | Route        | Status |
| --------- | ------------ | ------ |
| Home      | `/`          | live   |
| Quests    | `/quests`    | live   |
| Inventory | `/inventory` | live   |
| Energy    | `/energy`    | live   |
| Wallet    | `/wallet`    | live   |
| Profile   | `/profile`   | live   |
| Docs      | `/docs`      | live   |
| Chat      | `/chat`      | live   |
| Changelog | `/changelog` | live   |

## More menu (unpinned)

| UI label                | Route            | Status              |
| ----------------------- | ---------------- | ------------------- |
| Processes               | `/processes`     | live                |
| Import/export gamesaves | `/gamesaves`     | live                |
| Cloud Sync              | `/cloudsync`     | live                |
| Custom Content Backup   | `/contentbackup` | live                |
| Guilds                  | `/guilds`        | menu entry disabled |
| Stats                   | `/stats`         | live                |
| Achievements            | `/achievements`  | live                |
| Leaderboard             | `/leaderboard`   | live                |
| Locations               | `/locations`     | menu entry disabled |
| Titles                  | `/titles`        | live                |
| Toolbox                 | `/toolbox`       | live                |
| Settings                | `/settings`      | live                |

External links in the More menu: Discord, Twitter, and GitHub.

## Authoring + management entry points

- Quests: `/quests/create`, `/quests/manage`, `/quests/:id/edit`
- Items: `/inventory/create`, `/inventory/manage`, `/inventory/item/:itemId/edit`
- Processes: `/processes/create`, `/processes/manage`, `/processes/:processId/edit`

## Utility + system routes

- Save safety: `/gamesaves`, `/cloudsync`, `/contentbackup`
- Player telemetry/progression: `/stats`, `/achievements`, `/titles`, `/leaderboard`
- Ops and diagnostics: `/toolbox`, `/settings`, `/debug`, `/dchat`

## Dynamic route patterns

- Docs: `/docs/:slug`
- Changelog entry anchors: `/changelog#YYYYMMDD`
- Outage docs: `/docs/outages/:slug`
- Quest detail: `/quests/:pathId/:questId` and `.../edit`, `.../finished`
- Process detail: `/processes/:processId`
- Inventory detail: `/inventory/item/:itemId`
- Shop flows: `/shop/buy/:itemId/:count`, `/shop/sell/:itemId/:count`

## Link-checking behavior

Internal markdown links are validated by `scripts/link-check.mjs` without starting the app.
Dynamic segments are resolved against Astro file routes.

Run from repo root:

```bash
node scripts/link-check.mjs
```

## Common click paths

- More → Processes opens `/processes`.
- More → Import/export gamesaves opens `/gamesaves`.
- More → Cloud Sync opens `/cloudsync`.
- More → Custom Content Backup opens `/contentbackup`.
- More → Guilds is marked **Coming soon** (no navigation yet).
- More → Stats opens `/stats`.
- More → Achievements opens `/achievements`.
- More → Leaderboard opens `/leaderboard`.
- More → Locations is marked **Coming soon** (no navigation yet).
- More → Titles opens `/titles`.
- More → Toolbox opens `/toolbox`.
- More → Settings opens `/settings`.
- Quests page → Manage button opens `/quests/manage`.
- Inventory page → Manage button opens `/inventory/manage`.
- Processes page → Manage button opens `/processes/manage`.
