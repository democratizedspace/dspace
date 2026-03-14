---
title: 'Routes'
slug: 'routes'
---

# DSPACE Routes

This page lists canonical in-app routes and click paths for v3.
It mirrors `docs/ROUTES.md` and `frontend/src/config/menu.json`.

## Top navigation (pinned)

| UI label | Route |
| --- | --- |
| Home | `/` |
| Quests | `/quests` |
| Inventory | `/inventory` |
| Energy | `/energy` |
| Wallet | `/wallet` |
| Profile | `/profile` |
| Docs | `/docs` |
| Chat | `/chat` |
| Changelog | `/changelog` |

## More menu (unpinned)

| UI label | Route | Status |
| --- | --- | --- |
| Processes | `/processes` | live |
| Import/export gamesaves | `/gamesaves` | live |
| Cloud Sync | `/cloudsync` | live |
| Custom Content Backup | `/contentbackup` | live |
| Guilds | `/guilds` | coming soon |
| Stats | `/stats` | live |
| Achievements | `/achievements` | live |
| Leaderboard | `/leaderboard` | live |
| Locations | `/locations` | coming soon |
| Titles | `/titles` | live |
| Toolbox | `/toolbox` | live |
| Settings | `/settings` | live |

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

- More → Toolbox → save + diagnostics utilities
- More → Settings → account + migration + environment controls
- Quests → Manage → Create for custom quest authoring
- Inventory → Manage → Create for custom item authoring
- Processes → Manage → Create for custom process authoring
