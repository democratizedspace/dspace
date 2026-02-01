---
title: 'Routes'
slug: 'routes'
---

# Routes

This page publishes the canonical route catalog for DSPACE. Dynamic segments are written as
`:param`.

## Canonical Route Index

| Label | Route | Notes | Nav location |
| --- | --- | --- | --- |
| Home | `/` | Homepage | Top nav |
| Quests | `/quests` | Quest list | Top nav |
| Inventory | `/inventory` | Inventory list | Top nav |
| Energy | `/energy` | Energy management | Top nav |
| Wallet | `/wallet` | Wallet overview | Top nav |
| Profile | `/profile` | Player profile | Top nav |
| Docs | `/docs` | Docs index | Top nav |
| Chat | `/chat` | Chat interface | Top nav |
| Changelog | `/changelog` | Release notes | Top nav |
| Processes | `/processes` | Process list | More menu |
| Game saves | `/gamesaves` | Import/export saves | More menu |
| Cloud sync | `/cloudsync` | Cloud sync setup | More menu |
| Custom content backup | `/contentbackup` | Backup/export custom content | More menu |
| Stats | `/stats` | Player statistics | More menu |
| Achievements | `/achievements` | Achievement list | More menu |
| Leaderboard | `/leaderboard` | Global leaderboard | More menu |
| Titles | `/titles` | Title collection | More menu |
| Toolbox | `/toolbox` | QA + admin toolbox | More menu |
| Settings | `/settings` | User settings | More menu |
| Shop | `/shop` | Shop landing page | Nav smoke test |
| Manage quests | `/quests/manage` | Custom quest manager | Toolbox |
| Create quest | `/quests/create` | Quest builder | Toolbox |
| Edit quest | `/quests/:id/edit` | Edit quest by ID | Toolbox |
| Edit quest (nested) | `/quests/:pathId/:questId/edit` | Edit nested quest | Toolbox |
| Manage inventory | `/inventory/manage` | Custom item manager | Toolbox |
| Create inventory item | `/inventory/create` | Item builder | Toolbox |
| Edit inventory item | `/inventory/item/:itemId/edit` | Edit item by ID | Toolbox |
| Manage processes | `/processes/manage` | Custom process manager | Toolbox |
| Create process | `/processes/create` | Process builder | Toolbox |
| Edit process | `/processes/:processId/edit` | Edit process by ID | Toolbox |
| Quest detail (simple) | `/quests/:id` | Quest by ID | - |
| Quest detail (nested) | `/quests/:pathId/:questId` | Quest by path/id | - |
| Quest completion | `/quests/:pathId/:questId/finished` | Completion page | - |
| Quest review | `/quests/review` | Review queue | - |
| Quest submit | `/quests/submit` | Submission flow | - |
| Quest fixture | `/quests/fixtures/ancestor-highlights` | QA fixture | - |
| Inventory item detail | `/inventory/item/:itemId` | Item detail page | - |
| Alternate item create | `/items/create` | Legacy create path | - |
| Process detail | `/processes/:processId` | Process detail | - |
| Legacy process route | `/process/:slug` | Legacy process slug | - |
| Routes catalog | `/docs/routes` | Canonical route catalog | Docs |
| Docs page | `/docs/:slug` | Docs markdown pages | Docs |
| Outages index | `/docs/outages` | Outages landing page | Docs |
| Outage detail | `/docs/outages/:slug` | Outage write-ups | Docs |
| Changelog doc detail | `/docs/changelog/:slug` | Changelog entry | Docs |
| Buy item | `/shop/buy/:itemId` | Purchase flow | - |
| Buy quantity | `/shop/buy/:itemId/:count` | Purchase quantity | - |
| Buy insufficient balance | `/shop/buy/:itemId/:count/insufficient_balance` | Error page | - |
| Sell item | `/shop/sell/:itemId` | Sell flow | - |
| Sell quantity | `/shop/sell/:itemId/:count` | Sell quantity | - |
| Sell insufficient items | `/shop/sell/:itemId/:count/insufficient_items` | Error page | - |
| Version import | `/import/:newVersion/:oldVersion` | Migration flow | - |
| Import completion | `/import/:newVersion/:oldVersion/done` | Migration done | - |
| Accept cookies | `/accept_cookies` | Consent page | - |
| Cookies accepted | `/accepted_cookies` | Consent confirmation | - |
| Debug tools | `/debug` | Debug tools | - |
| dChat | `/dchat` | AI assistant | - |
| Profile avatar | `/profile/avatar` | Avatar picker | - |
| Skills | `/skills` | Skills overview | - |
| Task | `/task` | Task page | - |
| Launch | `/launch` | Launch page | - |
| Bundle submit | `/bundles/submit` | Bundle submission | - |
| Not found | `/404` | 404 page | - |
| Config JSON | `/config.json` | Runtime config | - |
| Health | `/health` | Health probe | - |
| Health (legacy) | `/healthz` | Health probe | - |
| Liveness | `/livez` | Liveness probe | - |
| Metrics | `/metrics` | Prometheus metrics | - |

## Link checker rules

The internal link checker resolves Markdown links without starting the server. It maps static
routes to files in `frontend/src/pages/` and dynamic routes to bracketed patterns.

Common patterns:

- `/docs/:slug` → `frontend/src/pages/docs/[slug].astro`
- `/quests/:id` → `frontend/src/pages/quests/[id].astro`
- `/quests/:pathId/:questId` → `frontend/src/pages/quests/[pathId]/[questId].astro`
- `/inventory/item/:itemId` → `frontend/src/pages/inventory/item/[itemId]/index.astro`
