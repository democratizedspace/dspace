# DSPACE Routes Documentation

This document describes all routes served by the Astro SSR server. Understanding these routes is
essential for link checking, testing, and development.

## Route Patterns

- This catalog expresses dynamic segments using `:param` notation (example: `/quests/:id`).
- Astro file-based routing uses bracketed filenames for dynamic segments; refer to
  `frontend/src/pages/` for the exact file structure.

## Canonical Route Index

The table below is the canonical route catalog used for navigation and RAG grounding.

| Category | Route | Description |
| --- | --- | --- |
| Core nav | `/` | Homepage |
| Core nav | `/quests` | Quest list |
| Core nav | `/inventory` | Inventory list |
| Core nav | `/energy` | Energy management |
| Core nav | `/wallet` | Wallet overview |
| Core nav | `/profile` | Player profile |
| Core nav | `/docs` | Docs landing page |
| Core nav | `/chat` | Chat interface |
| Core nav | `/changelog` | Changelog landing page |
| More menu | `/processes` | Process list |
| More menu | `/gamesaves` | Import/export game saves |
| More menu | `/cloudsync` | Cloud sync |
| More menu | `/contentbackup` | Custom content backup |
| More menu | `/stats` | Player stats |
| More menu | `/achievements` | Achievements |
| More menu | `/leaderboard` | Leaderboard |
| More menu | `/titles` | Titles |
| More menu | `/toolbox` | Toolbox utilities hub |
| More menu | `/settings` | Settings |
| Custom content | `/quests/manage` | Manage quests |
| Custom content | `/quests/create` | Create quest |
| Custom content | `/quests/:id` | Quest details (simple pattern) |
| Custom content | `/quests/:id/edit` | Edit quest (simple pattern) |
| Custom content | `/quests/:pathId/:questId` | Quest details (nested pattern) |
| Custom content | `/quests/:pathId/:questId/edit` | Edit quest (nested pattern) |
| Custom content | `/quests/:pathId/:questId/finished` | Quest completion page |
| Custom content | `/quests/review` | Review quests |
| Custom content | `/quests/submit` | Submit quest |
| Custom content | `/quests/fixtures/ancestor-highlights` | Quest graph fixture for QA |
| Custom content | `/inventory/manage` | Manage inventory |
| Custom content | `/inventory/create` | Create inventory item |
| Custom content | `/inventory/item/:itemId` | Item details |
| Custom content | `/inventory/item/:itemId/edit` | Edit custom item |
| Custom content | `/items/create` | Create item (alternate path) |
| Custom content | `/processes/manage` | Manage processes |
| Custom content | `/processes/create` | Create process |
| Custom content | `/processes/:processId` | Process details |
| Custom content | `/processes/:processId/edit` | Edit process |
| Custom content | `/process/:slug` | Legacy process path |
| Custom content | `/item/:slug` | Item detail (legacy path) |
| Docs | `/docs/:slug` | Docs page by slug |
| Docs | `/docs/changelog/:slug` | Changelog entry detail |
| Shop | `/shop` | Shop index |
| Shop | `/shop/buy/:itemId` | Buy item |
| Shop | `/shop/buy/:itemId/:count` | Buy quantity |
| Shop | `/shop/buy/:itemId/:count/insufficient_balance` | Insufficient balance error |
| Shop | `/shop/sell/:itemId` | Sell item |
| Shop | `/shop/sell/:itemId/:count` | Sell quantity |
| Shop | `/shop/sell/:itemId/:count/insufficient_items` | Insufficient items error |
| Import/migration | `/import/:newVersion/:oldVersion` | Import from old version |
| Import/migration | `/import/:newVersion/:oldVersion/done` | Import completion |
| Utility pages | `/404` | 404 error page |
| Utility pages | `/accept_cookies` | Cookie acceptance |
| Utility pages | `/accepted_cookies` | Cookie acceptance confirmation |
| Utility pages | `/skills` | Skills page |
| Utility pages | `/task` | Task page |
| Utility pages | `/launch` | Launch page |
| Utility pages | `/dchat` | dChat interface |
| Utility pages | `/debug` | Debug tools |
| Utility pages | `/bundles/submit` | Bundle submission |
| Service endpoints | `/config.json` | Runtime configuration |
| Service endpoints | `/health` | Health check |
| Service endpoints | `/healthz` | Health check (k8s) |
| Service endpoints | `/livez` | Liveness check |
| Service endpoints | `/metrics` | Metrics endpoint |
| Service endpoints | `/sharedSchemas/hardening.json` | Shared schema export |

## Nav Map (UI label → route)

### Top navigation

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

### More menu

| UI label | Route |
| --- | --- |
| Processes | `/processes` |
| Import/export gamesaves | `/gamesaves` |
| Cloud Sync | `/cloudsync` |
| Custom Content Backup | `/contentbackup` |
| Stats | `/stats` |
| Achievements | `/achievements` |
| Leaderboard | `/leaderboard` |
| Titles | `/titles` |
| Toolbox | `/toolbox` |
| Settings | `/settings` |

## Route Resolution for Link Checking

When validating internal links in markdown files, the link checker
(`scripts/link-check.mjs`) resolves paths by:

1. Exact match: `/inventory` → `frontend/src/pages/inventory/index.astro`
2. Index pattern: `/quests` → `frontend/src/pages/quests/index.astro`
3. Slug pattern: `/docs/about` → `frontend/src/pages/docs/:slug.astro`
4. ID pattern: `/quests/1` → `frontend/src/pages/quests/:id.astro`
5. Nested dynamic: `/quests/play/2` → `frontend/src/pages/quests/:pathId/:questId.astro`
6. Parameterized: `/inventory/item/37` →
   `frontend/src/pages/inventory/item/:itemId/index.astro`

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
- Dynamic route segments are documented with `:param` notation
- All routes must map to a physical `.astro`, `.md`, or endpoint file
- The link checker validates these routes without requiring server startup
- External links (containing `://`) are validated by lychee in CI
