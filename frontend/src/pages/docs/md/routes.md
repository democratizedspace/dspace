---
title: 'Routes'
slug: 'routes'
---

# DSPACE Routes

This page lists the canonical Astro SSR routes served by DSPACE. It mirrors
`docs/ROUTES.md` and is intended for quick lookups and RAG grounding.

## Route patterns

Astro uses file-based routing where files in `frontend/src/pages/` map to URL paths. In this
catalog, dynamic segments use `:param` notation (for example, `/quests/:id`).

## Nav map (click-path grounding)

<a id="top"></a>

This nav map is the citeable click-path grounding reference. It mirrors
`docs/ROUTES.md` and uses the exact UI labels from `frontend/src/config/menu.json`.

### Top navigation (pinned)

| UI label | Route | Notes |
| --- | --- | --- |
| Home | / | Homepage |
| Quests | /quests | Quest list |
| Inventory | /inventory | Inventory list |
| Energy | /energy | Energy management |
| Wallet | /wallet | Wallet overview |
| Profile | /profile | Player profile |
| Docs | /docs | Documentation index |
| Chat | /chat | Chat interface |
| Changelog | /changelog | Release notes |

### More menu (unpinned)

| UI label | Route | Notes |
| --- | --- | --- |
| Processes | /processes | Process list |
| Import/export gamesaves | /gamesaves | Save import/export |
| Cloud Sync | /cloudsync | Cloud sync setup |
| Custom Content Backup | /contentbackup | Backup management |
| Guilds | /guilds | Coming soon |
| Stats | /stats | Player statistics |
| Achievements | /achievements | Achievement list |
| Leaderboard | /leaderboard | Global leaderboard |
| Locations | /locations | Coming soon |
| Titles | /titles | Player titles |
| Toolbox | /toolbox | Utilities & QA tools |
| Settings | /settings | User settings |
| Discord | https://discord.gg/A3UAfYvnxM | External link |
| Twitter | https://twitter.com/dspacegame | External link |
| Github | https://github.com/democratizedspace/dspace | External link |

## Canonical route index

This section is the citeable route catalog. Use the anchor
`/docs/routes#canonical-route-index` when you need a stable reference.

<a id="canonical-route-index"></a>

### Custom content authoring

| Route | Description |
| --- | --- |
| /quests/create | Create a custom quest |
| /quests/manage | Manage custom quests |
| /quests/:id/edit | Edit a custom quest |
| /inventory/create | Create a custom item |
| /inventory/manage | Manage custom inventory |
| /inventory/item/:itemId/edit | Edit a custom inventory item |
| /processes/create | Create a custom process |
| /processes/manage | Manage custom processes |
| /processes/:processId/edit | Edit a custom process |

## Static routes

### Core pages

- / - Homepage (index.astro)
- /404 - 404 error page
- /settings - User settings
- /stats - User statistics
- /skills - Skills page
- /task - Task page
- /launch - Launch page
- /changelog - Changelog page
- /wallet - Wallet overview
- /toolbox - Toolbox utilities

### Cookie management

- /accept_cookies - Cookie acceptance page
- /accepted_cookies - Cookie acceptance confirmation

### Profile & achievements

- /profile - User profile page
- /profile/avatar - Avatar selection
- /achievements - User achievements page
- /titles - User titles page
- /leaderboard - Global leaderboard

### Game systems

- /energy - Energy management page
- /gamesaves - Game save import/export
- /cloudsync - Cloud synchronization
- /contentbackup - Content backup management

### Chat & debug

- /chat - Chat interface
- /dchat - dChat interface (AI assistant)
- /debug - Debug tools

## Dynamic routes

### Documentation

- /docs - Documentation index
- /docs/:slug - Individual documentation pages
    - Examples: /docs/about, /docs/solar, /docs/team, /docs/processes

### Inventory

- /inventory - Inventory list
- /inventory/create - Create new item
- /inventory/manage - Manage inventory
- /inventory/item/:itemId - Individual item details
    - Examples: /inventory/item/1, /inventory/item/37, /inventory/item/50
- /inventory/item/:itemId/edit - Edit custom item
    - Examples: /inventory/item/1/edit, /inventory/item/37/edit, /inventory/item/50/edit

### Items (alternative inventory routes)

- /items/create - Create new item (alternative path)
- /item/:slug - Removed legacy route (no longer available)

### Processes

- /process/:slug - Process by slug (legacy pattern)
- /processes - Processes list
- /processes/:processId - Individual process details
    - Examples: /processes/launch-rocket, /processes/feed-goldfish
- /processes/:processId/edit - Edit custom process
- /processes/create - Create new process
- /processes/manage - Manage processes

### Quests

- /quests - Quest list
- /quests/create - Create new quest
- /quests/manage - Manage quests
- /quests/review - Review quests
- /quests/submit - Submit quest
- /quests/:id - Quest by ID (simple pattern)
- /quests/fixtures/ancestor-highlights - Quest graph fixture used for ancestor/descendant QA
- /quests/:id/edit - Edit quest by ID
- /quests/:pathId/:questId - Quest by path and ID (nested pattern)
    - Examples: /quests/play/2, /quests/custom/5
- /quests/:pathId/:questId/edit - Edit nested quest
- /quests/:pathId/:questId/finished - Quest completion page

### Shop

- /shop - Shop index
- /shop/buy/:itemId - Buy item page
- /shop/buy/:itemId/:count - Buy specific quantity
- /shop/buy/:itemId/:count/insufficient_balance - Insufficient balance error
- /shop/sell/:itemId - Sell item page
- /shop/sell/:itemId/:count - Sell specific quantity
- /shop/sell/:itemId/:count/insufficient_items - Insufficient items error

### Import/migration

- /import/:newVersion/:oldVersion - Import from old version
- /import/:newVersion/:oldVersion/done - Import completion

## Route resolution for link checking

When validating internal links in markdown files, the link checker
(`scripts/link-check.mjs`) resolves paths by:

1. Exact match: /inventory → frontend/src/pages/inventory/index.astro
2. Index pattern: /quests → frontend/src/pages/quests/index.astro
3. Slug pattern: /docs/about → frontend/src/pages/docs/{slug}.astro
4. ID pattern: /quests/1 → frontend/src/pages/quests/{id}.astro
5. Nested dynamic: /quests/play/2 → frontend/src/pages/quests/{pathId}/{questId}.astro
6. Parameterized: /inventory/item/37 → frontend/src/pages/inventory/item/{itemId}/index.astro

## Static assets

Static assets are served from:

- frontend/public/ - Main public directory
- /assets/ - Images and media files

Examples:

- /assets/rescue.jpg
- /assets/changelog/20230105/back_forward.jpg
- /assets/rocket_min.gif

## Adding new routes

When adding new routes:

1. Create the `.astro` file in `frontend/src/pages/`
2. Update this documentation if introducing a new route pattern
3. Ensure `scripts/link-check.mjs` can resolve the pattern
4. Test with `node scripts/link-check.mjs`
