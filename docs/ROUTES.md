# DSPACE Routes Documentation

This document describes all routes served by the Astro SSR server. Understanding these routes is
essential for link checking, testing, and development.

## Nav map (UI labels → routes)

### Top navigation

| UI label | Route | Notes |
| --- | --- | --- |
| Home | / | Homepage |
| Quests | /quests | Quest list |
| Inventory | /inventory | Inventory list |
| Energy | /energy | Energy management |
| Wallet | /wallet | Balances and basic income |
| Profile | /profile | User profile |
| Docs | /docs | Documentation index |
| Chat | /chat | Chat interface |
| Changelog | /changelog | Release notes |

### More menu & utilities

| UI label | Route | Notes |
| --- | --- | --- |
| Processes | /processes | Process list |
| Import/export gamesaves | /gamesaves | Game save import/export |
| Cloud Sync | /cloudsync | Cloud synchronization |
| Custom Content Backup | /contentbackup | Custom content backup/export |
| Stats | /stats | User statistics |
| Achievements | /achievements | Achievements roster |
| Leaderboard | /leaderboard | Global leaderboard |
| Titles | /titles | Unlockable titles |
| Toolbox | /toolbox | Utilities hub |
| Settings | /settings | User settings |

## Canonical route index

### Custom content management & detail routes

| Feature | Route | Notes |
| --- | --- | --- |
| Quest management | /quests/manage | Manage custom quests |
| Quest creation | /quests/create | Create a new quest |
| Quest detail | /quests/:id | Quest by numeric ID |
| Quest edit | /quests/:id/edit | Edit quest by numeric ID |
| Quest by path | /quests/:pathId/:questId | Quest by path and ID |
| Quest edit (path) | /quests/:pathId/:questId/edit | Edit nested quest |
| Quest completion | /quests/:pathId/:questId/finished | Quest completion page |
| Inventory management | /inventory/manage | Manage custom items |
| Inventory creation | /inventory/create | Create a new item |
| Inventory item detail | /inventory/item/:itemId | Item details |
| Inventory item edit | /inventory/item/:itemId/edit | Edit custom item |
| Process management | /processes/manage | Manage custom processes |
| Process creation | /processes/create | Create a new process |
| Process detail | /processes/:processId | Process details |
| Process edit | /processes/:processId/edit | Edit custom process |

## Route patterns

Astro uses file-based routing where files in `frontend/src/pages/` map to URL paths. In this
catalog, dynamic segments use the `:param` format for consistency (for example, `/quests/:id`).

## Static routes

### Core pages

- / - Homepage (index.astro)
- /404 - 404 error page
- /quests - Quest list
- /inventory - Inventory list
- /energy - Energy management page
- /wallet - Wallet balances and basic income
- /profile - User profile page
- /docs - Documentation index
- /chat - Chat interface
- /changelog - Changelog page
- /settings - User settings
- /stats - User statistics
- /skills - Skills page
- /task - Task page
- /launch - Launch page
- /toolbox - Utilities hub

### Cookie management

- /accept_cookies - Cookie acceptance page
- /accepted_cookies - Cookie acceptance confirmation

### Profile & achievements

- /profile/avatar - Avatar selection
- /achievements - User achievements page
- /titles - User titles page
- /leaderboard - Global leaderboard

### Game systems

- /processes - Processes list
- /gamesaves - Game save import/export
- /cloudsync - Cloud synchronization
- /contentbackup - Content backup management

### Chat & debug

- /dchat - dChat interface (AI assistant)
- /debug - Debug tools

## Dynamic routes

### Documentation

- /docs/:slug - Individual documentation pages
    - Examples: /docs/about, /docs/solar, /docs/team, /docs/processes

### Inventory

- /inventory/item/:itemId - Individual item details
    - Examples: /inventory/item/1, /inventory/item/37, /inventory/item/50
- /inventory/item/:itemId/edit - Edit custom item
    - Examples: /inventory/item/1/edit, /inventory/item/37/edit, /inventory/item/50/edit

### Items (alternative inventory routes)

- /items/create - Create new item (alternative path)

### Processes

- /process/:slug - Process by slug (legacy pattern)
- /processes/:processId - Individual process details
    - Examples: /processes/launch-rocket, /processes/feed-goldfish

### Quests

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

When validating internal links in markdown files, the link checker (`scripts/link-check.mjs`)
resolves paths by:

1. Exact match: /inventory → frontend/src/pages/inventory/index.astro
2. Index pattern: /quests → frontend/src/pages/quests/index.astro
3. Slug pattern: /docs/about → frontend/src/pages/docs/[slug].astro
4. ID pattern: /quests/1 → dynamic quest ID route
5. Nested dynamic: /quests/play/2 → frontend/src/pages/quests/[pathId]/[questId].astro
6. Parameterized: /inventory/item/37 → frontend/src/pages/inventory/item/[itemId]/index.astro

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

## Testing route resolution

To verify the link checker correctly resolves routes:

```bash
# Run link checker on all markdown files
node scripts/link-check.mjs

# Test specific routes by creating a test markdown file
echo '- [Test](/docs/about)' > test.md
node scripts/link-check.mjs
rm test.md
```

## Notes for AI agents

- Routes starting with `/` are internal Astro SSR routes
- Dynamic route segments use the `:param` syntax in this catalog
- All routes must map to a physical `.astro` or `.md` file
- The link checker validates these routes without requiring server startup
- External links (containing `://`) are validated by lychee in CI
