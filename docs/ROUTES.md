# DSPACE Routes Documentation

This document describes all routes served by the Astro SSR server. Use the canonical route
index below for navigation lookups and chat responses.

## Canonical Route Index

| Label | Route | Notes | Nav location |
| --- | --- | --- | --- |
| Home | `/` | Homepage | Top nav (pinned) |
| Quests | `/quests` | Quest list | Top nav (pinned) |
| Inventory | `/inventory` | Inventory list | Top nav (pinned) |
| Energy | `/energy` | Energy dashboard | Top nav (pinned) |
| Wallet | `/wallet` | Token balances | Top nav (pinned) |
| Profile | `/profile` | Player profile | Top nav (pinned) |
| Docs | `/docs` | Documentation index | Top nav (pinned) |
| Chat | `/chat` | Chat assistant | Top nav (pinned) |
| Changelog | `/changelog` | Release notes | Top nav (pinned) |
| Processes | `/processes` | Process list | More menu |
| Import/export gamesaves | `/gamesaves` | Game state import/export | More menu |
| Cloud Sync | `/cloudsync` | GitHub gist sync | More menu |
| Custom Content Backup | `/contentbackup` | Custom content backup/export | More menu |
| Stats | `/stats` | Player stats | More menu |
| Achievements | `/achievements` | Achievements list | More menu |
| Leaderboard | `/leaderboard` | Global leaderboard | More menu |
| Titles | `/titles` | Title selection | More menu |
| Toolbox | `/toolbox` | Links to save tools | More menu |
| Settings | `/settings` | User settings | More menu |
| 404 | `/404` | Not found page | |
| Accept cookies | `/accept_cookies` | Cookie consent | |
| Cookies accepted | `/accepted_cookies` | Cookie confirmation | |
| Profile avatar | `/profile/avatar` | Avatar selection | |
| Skills | `/skills` | Skills page | |
| Task | `/task` | Task page | |
| Launch | `/launch` | Launch page | |
| dChat | `/dchat` | Alternate chat UI | |
| Debug | `/debug` | Debug tools | |
| Docs (slug) | `/docs/:slug` | Documentation pages | |
| Docs (outages) | `/docs/outages/:slug` | Outage reports | |
| Inventory create | `/inventory/create` | Create custom item | Custom content |
| Inventory manage | `/inventory/manage` | Manage custom items | Custom content |
| Inventory item | `/inventory/item/:itemId` | Item detail | |
| Inventory edit | `/inventory/:id/edit` | Prompt canonical edit route (implemented at `/inventory/item/:itemId/edit`) | Custom content |
| Inventory item edit | `/inventory/item/:itemId/edit` | Edit custom item | Custom content |
| Items create | `/items/create` | Alternate item create path | |
| Processes create | `/processes/create` | Create custom process | Custom content |
| Processes manage | `/processes/manage` | Manage custom processes | Custom content |
| Processes detail | `/processes/:id` | Process detail | |
| Processes edit | `/processes/:id/edit` | Edit custom process | Custom content |
| Process legacy | `/process/:slug` | Legacy process path | |
| Quests create | `/quests/create` | Create custom quest | Custom content |
| Quests manage | `/quests/manage` | Manage custom quests | Custom content |
| Quests review | `/quests/review` | Quest review queue | |
| Quests submit | `/quests/submit` | Quest submission | |
| Quests detail | `/quests/:id` | Quest by ID | |
| Quests edit | `/quests/:id/edit` | Edit custom quest | Custom content |
| Quests fixture | `/quests/fixtures/ancestor-highlights` | QA fixture | |
| Quests nested | `/quests/:pathId/:questId` | Quest by path | |
| Quests nested edit | `/quests/:pathId/:questId/edit` | Edit nested quest | Custom content |
| Quests finished | `/quests/:pathId/:questId/finished` | Quest completion | |
| Shop | `/shop` | Shop index | |
| Shop buy | `/shop/buy/:itemId` | Buy item | |
| Shop buy qty | `/shop/buy/:itemId/:count` | Buy quantity | |
| Shop buy insufficient balance | `/shop/buy/:itemId/:count/insufficient_balance` | Error state | |
| Shop sell | `/shop/sell/:itemId` | Sell item | |
| Shop sell qty | `/shop/sell/:itemId/:count` | Sell quantity | |
| Shop sell insufficient items | `/shop/sell/:itemId/:count/insufficient_items` | Error state | |
| Import | `/import/:newVersion/:oldVersion` | Legacy import | |
| Import done | `/import/:newVersion/:oldVersion/done` | Import completion | |

## Route Patterns

Astro uses file-based routing where files in `frontend/src/pages/` map to URL paths. Dynamic
segments are denoted by brackets (e.g., `[id].astro`).

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
