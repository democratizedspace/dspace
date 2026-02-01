---
title: 'Routes'
slug: 'routes'
---

# Routes

Use this page as the canonical route catalog for DSPACE. The table below is kept in sync with
`docs/ROUTES.md`, which the docs RAG indexer tags as `kind: route` chunks for /chat grounding.

## Canonical Route Index

| Label                   | Route                                           | Notes                         | Nav location   |
| ----------------------- | ----------------------------------------------- | ----------------------------- | -------------- |
| Home                    | `/`                                             | Homepage.                     | Main nav       |
| Quests                  | `/quests`                                       | Quest list and discovery.     | Main nav       |
| Inventory               | `/inventory`                                    | Inventory overview.           | Main nav       |
| Energy                  | `/energy`                                       | Energy systems dashboard.     | Main nav       |
| Wallet                  | `/wallet`                                       | Currency balances and income. | Main nav       |
| Profile                 | `/profile`                                      | Player profile.               | Main nav       |
| Docs                    | `/docs`                                         | Docs landing page.            | Main nav       |
| Chat                    | `/chat`                                         | In-game chat console.         | Main nav       |
| Changelog               | `/changelog`                                    | Release notes index.          | Main nav       |
| Processes               | `/processes`                                    | Process catalog.              | More menu      |
| Import/export gamesaves | `/gamesaves`                                    | Save import/export tools.     | More menu      |
| Cloud Sync              | `/cloudsync`                                    | GitHub Gist sync UI.          | More menu      |
| Custom Content Backup   | `/contentbackup`                                | Backup/export custom bundles. | More menu      |
| Stats                   | `/stats`                                        | Player stats overview.        | More menu      |
| Achievements            | `/achievements`                                 | Achievement list.             | More menu      |
| Leaderboard             | `/leaderboard`                                  | Leaderboard rankings.         | More menu      |
| Titles                  | `/titles`                                       | Titles unlocks.               | More menu      |
| Toolbox                 | `/toolbox`                                      | Utilities hub.                | More menu      |
| Settings                | `/settings`                                     | Settings page.                | More menu      |
| Docs: Routes            | `/docs/routes`                                  | Canonical route catalog.      | Docs           |
| Docs: page              | `/docs/:slug`                                   | Standard docs pages.          | Docs           |
| Docs: outages           | `/docs/outages/:slug`                           | Outage entries.               | Docs           |
| 404                     | `/404`                                          | Error page.                   | —              |
| Launch                  | `/launch`                                       | Launch splash.                | —              |
| Skills                  | `/skills`                                       | Skills overview.              | —              |
| Task                    | `/task`                                         | Task page.                    | —              |
| Accept cookies          | `/accept_cookies`                               | Cookie consent.               | —              |
| Accepted cookies        | `/accepted_cookies`                             | Cookie confirmation.          | —              |
| Profile avatar          | `/profile/avatar`                               | Avatar selection.             | —              |
| dChat                   | `/dchat`                                        | Alternative chat UI.          | —              |
| Debug                   | `/debug`                                        | Debug tools.                  | —              |
| Inventory: create       | `/inventory/create`                             | Create custom item.           | Custom content |
| Inventory: manage       | `/inventory/manage`                             | Manage custom items.          | Custom content |
| Inventory: item         | `/inventory/item/:itemId`                       | Item details.                 | Custom content |
| Inventory: item edit    | `/inventory/item/:itemId/edit`                  | Edit custom item.             | Custom content |
| Items: create           | `/items/create`                                 | Alternate create-item route.  | Custom content |
| Item detail             | `/item/:slug`                                   | Item detail by slug.          | —              |
| Processes: create       | `/processes/create`                             | Create custom process.        | Custom content |
| Processes: manage       | `/processes/manage`                             | Manage custom processes.      | Custom content |
| Processes: detail       | `/processes/:processId`                         | Process detail page.          | —              |
| Process (legacy)        | `/process/:slug`                                | Legacy process route.         | —              |
| Quests: create          | `/quests/create`                                | Create custom quest.          | Custom content |
| Quests: manage          | `/quests/manage`                                | Manage custom quests.         | Custom content |
| Quests: review          | `/quests/review`                                | Quest review queue.           | Custom content |
| Quests: submit          | `/quests/submit`                                | Quest submission form.        | Custom content |
| Quests: by ID           | `/quests/:id`                                   | Simple quest route.           | —              |
| Quests: edit by ID      | `/quests/:id/edit`                              | Edit quest by ID.             | Custom content |
| Quests: by path         | `/quests/:pathId/:questId`                      | Canonical quest route.        | —              |
| Quests: edit by path    | `/quests/:pathId/:questId/edit`                 | Edit nested quest.            | Custom content |
| Quests: finished        | `/quests/:pathId/:questId/finished`             | Quest completion.             | —              |
| Quests: fixture         | `/quests/fixtures/ancestor-highlights`          | QA fixture route.             | —              |
| Shop                    | `/shop`                                         | Shop landing.                 | —              |
| Shop: buy               | `/shop/buy/:itemId`                             | Buy item.                     | —              |
| Shop: buy count         | `/shop/buy/:itemId/:count`                      | Buy item quantity.            | —              |
| Shop: buy insufficient  | `/shop/buy/:itemId/:count/insufficient_balance` | Balance error.                | —              |
| Shop: sell              | `/shop/sell/:itemId`                            | Sell item.                    | —              |
| Shop: sell count        | `/shop/sell/:itemId/:count`                     | Sell item quantity.           | —              |
| Shop: sell insufficient | `/shop/sell/:itemId/:count/insufficient_items`  | Inventory error.              | —              |
| Import: migrate         | `/import/:newVersion/:oldVersion`               | Data migration.               | —              |
| Import: done            | `/import/:newVersion/:oldVersion/done`          | Migration complete.           | —              |
| Bundles: submit         | `/bundles/submit`                               | Bundle submission form.       | Custom content |
| Health                  | `/health`                                       | Health check.                 | —              |
| Health (alt)            | `/healthz`                                      | Health check (alt).           | —              |
| Liveness                | `/livez`                                        | Liveness check.               | —              |
| Metrics                 | `/metrics`                                      | Metrics endpoint.             | —              |
| Config                  | `/config.json`                                  | Runtime config endpoint.      | —              |

## Link-checker rules (reference)

The link checker (`scripts/link-check.mjs`) resolves internal routes with file-based patterns:

1. **Exact match**: `/inventory` → `frontend/src/pages/inventory/index.astro`
2. **Index pattern**: `/quests` → `frontend/src/pages/quests/index.astro`
3. **Slug pattern**: `/docs/about` → `frontend/src/pages/docs/[slug].astro`
4. **ID pattern**: `/quests/1` → `frontend/src/pages/quests/[id].astro`
5. **Nested dynamic**: `/quests/play/2` → `frontend/src/pages/quests/[pathId]/[questId].astro`
6. **Parameterized**: `/inventory/item/37` →
   `frontend/src/pages/inventory/item/[itemId]/index.astro`
