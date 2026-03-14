---
title: 'Routes'
slug: 'routes'
---

# DSPACE Routes (v3)

This page is the in-game mirror of the repository route catalog in
[`docs/ROUTES.md`](https://github.com/democratizedspace/dspace/blob/v3/docs/ROUTES.md).

## Navigation routes

### Top navigation (pinned)

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

### More menu (unpinned)

| UI label                | Route            | Status in menu config     |
| ----------------------- | ---------------- | ------------------------- |
| Processes               | `/processes`     | active                    |
| Import/export gamesaves | `/gamesaves`     | active                    |
| Cloud Sync              | `/cloudsync`     | active                    |
| Custom Content Backup   | `/contentbackup` | active                    |
| Guilds                  | `/guilds`        | tagged `comingSoon: true` |
| Stats                   | `/stats`         | active                    |
| Achievements            | `/achievements`  | active                    |
| Leaderboard             | `/leaderboard`   | active                    |
| Locations               | `/locations`     | tagged `comingSoon: true` |
| Titles                  | `/titles`        | active                    |
| Toolbox                 | `/toolbox`       | active                    |
| Settings                | `/settings`      | active                    |

## Key v3 system routes

- `/quests/create`, `/quests/manage`, `/quests/review`, `/quests/submit`
- `/inventory/create`, `/inventory/manage`, `/inventory/item/:itemId/edit`
- `/processes/create`, `/processes/manage`, `/processes/:processId/edit`
- `/chat#prompt-debug` (Settings debug entry point)
- `/docs/:slug` (in-game docs pages)

## How route correctness is validated

- Internal markdown links are checked by `node scripts/link-check.mjs`.
- Dynamic routes are resolved without starting the app server.
- The route list and nav labels are expected to stay aligned with
  `frontend/src/config/menu.json` and `docs/ROUTES.md`.

## See also

- [FAQ](/docs/faq)
- [Quest submission guide](/docs/quest-submission)
- [v3 release state](/docs/v3-release-state)
