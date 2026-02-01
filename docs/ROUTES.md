# DSPACE Routes Documentation

This document describes all routes served by the Astro SSR server. Understanding these routes is
essential for link checking, testing, and development.

## Canonical Route Index

| Label | Route | Notes | Nav location |
| --- | --- | --- | --- |
| Home | `/` | Homepage (index.astro). | Main nav |
| Quests | `/quests` | Quest list. | Main nav |
| Inventory | `/inventory` | Inventory list. | Main nav |
| Energy | `/energy` | Energy management page. | Main nav |
| Wallet | `/wallet` | Wallet dashboard. | Main nav |
| Profile | `/profile` | Player profile overview. | Main nav |
| Docs | `/docs` | Docs index. | Main nav |
| Chat | `/chat` | dChat assistant. | Main nav |
| Changelog | `/changelog` | Release notes viewer. | Main nav |
| Processes | `/processes` | Processes list. | More menu |
| Game saves | `/gamesaves` | Import/export save files. | More menu |
| Cloud sync | `/cloudsync` | Cloud sync settings. | More menu |
| Content backup | `/contentbackup` | Backup/restore custom content. | More menu |
| Stats | `/stats` | Game statistics snapshot. | More menu |
| Achievements | `/achievements` | Achievements list. | More menu |
| Leaderboard | `/leaderboard` | Global leaderboard. | More menu |
| Titles | `/titles` | Unlockable player titles. | More menu |
| Toolbox | `/toolbox` | Custom content tools hub. | More menu |
| Settings | `/settings` | User settings page. | More menu |
| Docs routes catalog | `/docs/routes` | Published route catalog (this table). | Docs |
| Docs page | `/docs/:slug` | Markdown docs in `frontend/src/pages/docs/md/`. | Docs |
| Quests by ID | `/quests/:id` | Built-in or custom quest by numeric id. | Quests |
| Quest path + id | `/quests/:pathId/:questId` | Canonical quest route (quest JSON). | Quests |
| Quest edit (simple id) | `/quests/:id/edit` | Custom quests edit form (`[id]/edit`). | Toolbox |
| Quest edit (path + id) | `/quests/:pathId/:questId/edit` | Edit nested quest. | Toolbox |
| Quest finished | `/quests/:pathId/:questId/finished` | Quest completion page. | Quests |
| Quest create | `/quests/create` | Create new custom quest. | Toolbox |
| Quest manage | `/quests/manage` | Manage custom quests. | Toolbox |
| Quest review | `/quests/review` | Review quest submissions. | Quests |
| Quest submit | `/quests/submit` | Submit a quest bundle. | Quests |
| Quest fixtures | `/quests/fixtures/ancestor-highlights` | Quest graph QA fixture. | QA |
| Inventory item | `/inventory/item/:itemId` | Inventory item detail. | Inventory |
| Inventory item edit | `/inventory/item/:itemId/edit` | Edit custom inventory item. | Toolbox |
| Inventory create | `/inventory/create` | Create custom inventory item. | Toolbox |
| Inventory manage | `/inventory/manage` | Manage custom inventory items. | Toolbox |
| Items create (legacy) | `/items/create` | Alternate item create path. | Toolbox |
| Processes detail | `/processes/:processId` | Process details page. | Processes |
| Processes edit | `/processes/:processId/edit` | Edit custom process. | Toolbox |
| Processes create | `/processes/create` | Create custom process. | Toolbox |
| Processes manage | `/processes/manage` | Manage custom processes. | Toolbox |
| Process (legacy) | `/process/:slug` | Legacy process route. | Processes |
| Shop | `/shop` | Shop index. | More menu |
| Shop buy | `/shop/buy/:itemId` | Buy an item. | Shop |
| Shop buy (count) | `/shop/buy/:itemId/:count` | Buy with quantity. | Shop |
| Shop buy (insufficient) | `/shop/buy/:itemId/:count/insufficient_balance` | Insufficient balance. | Shop |
| Shop sell | `/shop/sell/:itemId` | Sell an item. | Shop |
| Shop sell (count) | `/shop/sell/:itemId/:count` | Sell with quantity. | Shop |
| Shop sell (insufficient) | `/shop/sell/:itemId/:count/insufficient_items` | Insufficient items. | Shop |
| Import | `/import/:newVersion/:oldVersion` | Legacy save migration. | System |
| Import complete | `/import/:newVersion/:oldVersion/done` | Migration complete. | System |
| Profile avatar | `/profile/avatar` | Avatar selection. | Profile |
| Debug tools | `/debug` | Debug tools. | Debug |
| dChat (legacy) | `/dchat` | Legacy chat route. | Debug |
| Skills | `/skills` | Skills page. | More menu |
| Task | `/task` | Task page. | More menu |
| Launch | `/launch` | Launch page. | More menu |
| Cookie accept | `/accept_cookies` | Cookie acceptance page. | System |
| Cookie accepted | `/accepted_cookies` | Cookie acceptance confirmation. | System |
| 404 | `/404` | Error fallback page. | System |

## Route Patterns

Astro uses file-based routing where files in `frontend/src/pages/` map to URL paths. Dynamic
segments are denoted by brackets (e.g., `[id].astro`).

## Static Routes

### Core Pages
- `/` - Homepage (index.astro)
- `/404` - 404 error page
- `/settings` - User settings
- `/stats` - User statistics
- `/skills` - Skills page
- `/task` - Task page
- `/launch` - Launch page
- `/changelog` - Changelog page

### Cookie Management
- `/accept_cookies` - Cookie acceptance page
- `/accepted_cookies` - Cookie acceptance confirmation

### Profile & Achievements
- `/profile` - User profile page
- `/profile/avatar` - Avatar selection
- `/achievements` - User achievements page
- `/titles` - User titles page
- `/leaderboard` - Global leaderboard

### Game Systems
- `/energy` - Energy management page
- `/gamesaves` - Game save import/export
- `/cloudsync` - Cloud synchronization
- `/contentbackup` - Content backup management

### Chat & Debug
- `/chat` - Chat interface
- `/dchat` - dChat interface (AI assistant)
- `/debug` - Debug tools

## Dynamic Routes

### Documentation
- `/docs` - Documentation index
- `/docs/[slug]` - Individual documentation pages
  - Examples: `/docs/about`, `/docs/solar`, `/docs/team`, `/docs/processes`

### Inventory
- `/inventory` - Inventory list
- `/inventory/create` - Create new item
- `/inventory/manage` - Manage inventory
- `/inventory/item/[itemId]` - Individual item details
  - Examples: `/inventory/item/1`, `/inventory/item/37`, `/inventory/item/50`
- `/inventory/item/[itemId]/edit` - Edit custom item
  - Examples: `/inventory/item/1/edit`, `/inventory/item/37/edit`, `/inventory/item/50/edit`

### Items (Alternative Inventory Routes)
- `/items/create` - Create new item (alternative path)

### Processes
- `/process/[slug]` - Process by slug (legacy pattern)
- `/processes` - Processes list
- `/processes/[processId]` - Individual process details
  - Examples: `/processes/launch-rocket`, `/processes/feed-goldfish`
- `/processes/[processId]/edit` - Edit custom process
- `/processes/create` - Create new process
- `/processes/manage` - Manage processes

### Quests
- `/quests` - Quest list
- `/quests/create` - Create new quest
- `/quests/manage` - Manage quests
- `/quests/review` - Review quests
- `/quests/submit` - Submit quest
- `/quests/[id]` - Quest by ID (simple pattern)
- `/quests/fixtures/ancestor-highlights` - Quest graph fixture used for ancestor/descendant QA
- `/quests/[id]/edit` - Edit quest by ID
- `/quests/[pathId]/[questId]` - Quest by path and ID (nested pattern)
  - Examples: `/quests/play/2`, `/quests/custom/5`
- `/quests/[pathId]/[questId]/edit` - Edit nested quest
- `/quests/[pathId]/[questId]/finished` - Quest completion page

### Shop
- `/shop` - Shop index
- `/shop/buy/[itemId]` - Buy item page
- `/shop/buy/[itemId]/[count]` - Buy specific quantity
- `/shop/buy/[itemId]/[count]/insufficient_balance` - Insufficient balance error
- `/shop/sell/[itemId]` - Sell item page
- `/shop/sell/[itemId]/[count]` - Sell specific quantity
- `/shop/sell/[itemId]/[count]/insufficient_items` - Insufficient items error

### Import/Migration
- `/import/[newVersion]/[oldVersion]` - Import from old version
- `/import/[newVersion]/[oldVersion]/done` - Import completion

## Route Resolution for Link Checking

When validating internal links in markdown files, the link checker (`scripts/link-check.mjs`)
resolves paths by:

1. **Exact match**: `/inventory` → `frontend/src/pages/inventory/index.astro`
2. **Index pattern**: `/quests` → `frontend/src/pages/quests/index.astro`
3. **Slug pattern**: `/docs/about` → `frontend/src/pages/docs/[slug].astro`
4. **ID pattern**: `/quests/1` → `frontend/src/pages/quests/[id].astro`
5. **Nested dynamic**: `/quests/play/2` → `frontend/src/pages/quests/[pathId]/[questId].astro`
6. **Parameterized**: `/inventory/item/37` → `frontend/src/pages/inventory/item/[itemId]/index.astro`

## Static Assets

Static assets are served from:
- `frontend/public/` - Main public directory
- `/assets/` - Images and media files

Examples:
- `/assets/rescue.jpg`
- `/assets/changelog/20230105/back_forward.jpg`
- `/assets/rocket_min.gif`

## Adding New Routes

When adding new routes:

1. Create the `.astro` file in `frontend/src/pages/`
2. Update this documentation if introducing a new route pattern
3. Ensure `scripts/link-check.mjs` can resolve the pattern
4. Test with `node scripts/link-check.mjs`

## Testing Route Resolution

To verify the link checker correctly resolves routes:

```bash
# Run link checker on all markdown files
node scripts/link-check.mjs

# Test specific routes by creating a test markdown file
echo '- [Test](/docs/about)' > test.md
node scripts/link-check.mjs
rm test.md
```

## Notes for AI Agents

- Routes starting with `/` are internal Astro SSR routes
- Dynamic route segments use `[paramName]` syntax
- All routes must map to a physical `.astro` or `.md` file
- The link checker validates these routes without requiring server startup
- External links (containing `://`) are validated by lychee in CI
