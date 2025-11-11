# DSPACE Routes Documentation

This document describes all routes served by the Astro SSR server. Understanding these routes is essential for link checking, testing, and development.

## Route Patterns

Astro uses file-based routing where files in `frontend/src/pages/` map to URL paths. Dynamic segments are denoted by brackets (e.g., `[id].astro`).

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

### Items (Alternative Inventory Routes)
- `/items/create` - Create new item (alternative path)

### Processes
- `/process/[slug]` - Process by slug (legacy pattern)
- `/processes/[processId]` - Individual process details
  - Examples: `/processes/launch-rocket`, `/processes/feed-goldfish`
- `/processes/create` - Create new process
- `/processes/manage` - Manage processes

### Quests
- `/quests` - Quest list
- `/quests/create` - Create new quest
- `/quests/manage` - Manage quests
- `/quests/review` - Review quests
- `/quests/submit` - Submit quest
- `/quests/[id]` - Quest by ID (simple pattern)
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

When validating internal links in markdown files, the link checker (`scripts/link-check.mjs`) resolves paths by:

1. **Exact match**: `/inventory` → `frontend/src/pages/inventory/index.astro`
2. **Index pattern**: `/quests` → `frontend/src/pages/quests/index.astro`
3. **Slug pattern**: `/docs/about` → `frontend/src/pages/docs/[slug].astro`
4. **ID pattern**: `/quests/1` → `frontend/src/pages/quests/[id].astro`
5. **Nested dynamic**: `/quests/play/2` → `frontend/src/pages/quests/[pathId]/[questId].astro`
6. **Parameterized**: `/inventory/item/37` → `frontend/src/pages/inventory/item/[itemId].astro`

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
