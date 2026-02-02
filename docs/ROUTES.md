# DSPACE Routes Documentation

This document lists the canonical Astro SSR routes served by DSPACE. It is the
source of truth for RAG grounding and link validation, so keep it complete and
consistent.

## Canonical route index

### Top navigation (pinned)

| UI label | Route | Notes |
| --- | --- | --- |
| Home | / | Homepage |
| Quests | /quests | Quest hub |
| Inventory | /inventory | Inventory hub |
| Energy | /energy | Energy management |
| Wallet | /wallet | Wallet hub |
| Profile | /profile | Avatar + profile |
| Docs | /docs | Documentation landing |
| Chat | /chat | In-game chat assistant |
| Changelog | /changelog | Release history |

### More menu (utilities)

| UI label | Route | Notes |
| --- | --- | --- |
| Processes | /processes | Processes hub |
| Import/export gamesaves | /gamesaves | Save import/export |
| Cloud Sync | /cloudsync | Cloud save sync |
| Custom Content Backup | /contentbackup | Custom content backup |
| Stats | /stats | Game statistics |
| Achievements | /achievements | Achievement list |
| Leaderboard | /leaderboard | Donation leaderboard |
| Titles | /titles | Title roster |
| Toolbox | /toolbox | Utilities hub |
| Settings | /settings | Settings |

### System and utility pages

- /404 - 404 error page
- /accept_cookies - Cookie acceptance page
- /accepted_cookies - Cookie acceptance confirmation
- /skills - Skills page
- /task - Task page
- /launch - Launch page
- /dchat - dChat interface (AI assistant)
- /debug - Debug tools

### Documentation routes

- /docs - Documentation index
- /docs/:slug - Individual documentation pages
    - Examples: /docs/about, /docs/solar, /docs/team, /docs/processes

### Inventory and items

- /inventory - Inventory list
- /inventory/create - Create new item
- /inventory/manage - Manage inventory
- /inventory/item/:itemId - Individual item details
    - Examples: /inventory/item/1, /inventory/item/37, /inventory/item/50
- /inventory/item/:itemId/edit - Edit custom item
    - Examples: /inventory/item/1/edit, /inventory/item/37/edit, /inventory/item/50/edit
- /items/create - Create new item (alternative path)

### Processes

- /processes - Processes list
- /processes/create - Create new process
- /processes/manage - Manage processes
- /processes/:processId - Individual process details
    - Examples: /processes/launch-rocket, /processes/feed-goldfish
- /processes/:processId/edit - Edit custom process
- /process/:slug - Process by slug (legacy pattern)

### Quests

- /quests - Quest list
- /quests/create - Create new quest
- /quests/manage - Manage quests
- /quests/review - Review quests
- /quests/submit - Submit quest
- /quests/:id - Quest by ID (simple pattern)
- /quests/:id/edit - Edit quest by ID
- /quests/fixtures/ancestor-highlights - Quest graph fixture used for QA
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

### Import and migration

- /import/:newVersion/:oldVersion - Import from old version
- /import/:newVersion/:oldVersion/done - Import completion

## Nav map (click-path grounding)

Use these labels exactly as they appear in the UI when describing click paths.

### Top navigation

- Home → /
- Quests → /quests
- Inventory → /inventory
- Energy → /energy
- Wallet → /wallet
- Profile → /profile
- Docs → /docs
- Chat → /chat
- Changelog → /changelog

### More menu

- Processes → /processes
- Import/export gamesaves → /gamesaves
- Cloud Sync → /cloudsync
- Custom Content Backup → /contentbackup
- Stats → /stats
- Achievements → /achievements
- Leaderboard → /leaderboard
- Titles → /titles
- Toolbox → /toolbox
- Settings → /settings

## Route notation

- Dynamic segments are documented with a leading colon (for example, :itemId).
- The canonical catalog always uses :param notation, even when the underlying
  Astro files use parameterized filenames.

## Route resolution for link checking

When validating internal links in markdown files, the link checker
(`scripts/link-check.mjs`) resolves paths by:

1. Exact match: /inventory → frontend/src/pages/inventory/index.astro
2. Index pattern: /quests → frontend/src/pages/quests/index.astro
3. Slug pattern: /docs/about → frontend/src/pages/docs/slug route
4. ID pattern: /quests/1 → frontend/src/pages/quests/id route
5. Nested dynamic: /quests/play/2 → frontend/src/pages/quests/pathId/questId route
6. Parameterized: /inventory/item/37 → frontend/src/pages/inventory/item itemId route

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
