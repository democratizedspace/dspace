---
title: 'Routes Catalog'
slug: 'routes'
---

# Routes Catalog

## Canonical Route Index

| Label                    | Route                                           | Notes                                           | Nav location |
| ------------------------ | ----------------------------------------------- | ----------------------------------------------- | ------------ |
| Home                     | `/`                                             | Homepage (index.astro).                         | Main nav     |
| Quests                   | `/quests`                                       | Quest list.                                     | Main nav     |
| Inventory                | `/inventory`                                    | Inventory list.                                 | Main nav     |
| Energy                   | `/energy`                                       | Energy management page.                         | Main nav     |
| Wallet                   | `/wallet`                                       | Wallet dashboard.                               | Main nav     |
| Profile                  | `/profile`                                      | Player profile overview.                        | Main nav     |
| Docs                     | `/docs`                                         | Docs index.                                     | Main nav     |
| Chat                     | `/chat`                                         | dChat assistant.                                | Main nav     |
| Changelog                | `/changelog`                                    | Release notes viewer.                           | Main nav     |
| Processes                | `/processes`                                    | Processes list.                                 | More menu    |
| Game saves               | `/gamesaves`                                    | Import/export save files.                       | More menu    |
| Cloud sync               | `/cloudsync`                                    | Cloud sync settings.                            | More menu    |
| Content backup           | `/contentbackup`                                | Backup/restore custom content.                  | More menu    |
| Stats                    | `/stats`                                        | Game statistics snapshot.                       | More menu    |
| Achievements             | `/achievements`                                 | Achievements list.                              | More menu    |
| Leaderboard              | `/leaderboard`                                  | Global leaderboard.                             | More menu    |
| Titles                   | `/titles`                                       | Unlockable player titles.                       | More menu    |
| Toolbox                  | `/toolbox`                                      | Custom content tools hub.                       | More menu    |
| Settings                 | `/settings`                                     | User settings page.                             | More menu    |
| Docs routes catalog      | `/docs/routes`                                  | Published route catalog (this table).           | Docs         |
| Docs page                | `/docs/:slug`                                   | Markdown docs in `frontend/src/pages/docs/md/`. | Docs         |
| Quests by ID             | `/quests/:id`                                   | Built-in or custom quest by numeric id.         | Quests       |
| Quest path + id          | `/quests/:pathId/:questId`                      | Canonical quest route (quest JSON).             | Quests       |
| Quest edit (simple id)   | `/quests/:id/edit`                              | Custom quests edit form (`[id]/edit`).          | Toolbox      |
| Quest edit (path + id)   | `/quests/:pathId/:questId/edit`                 | Edit nested quest.                              | Toolbox      |
| Quest finished           | `/quests/:pathId/:questId/finished`             | Quest completion page.                          | Quests       |
| Quest create             | `/quests/create`                                | Create new custom quest.                        | Toolbox      |
| Quest manage             | `/quests/manage`                                | Manage custom quests.                           | Toolbox      |
| Quest review             | `/quests/review`                                | Review quest submissions.                       | Quests       |
| Quest submit             | `/quests/submit`                                | Submit a quest bundle.                          | Quests       |
| Quest fixtures           | `/quests/fixtures/ancestor-highlights`          | Quest graph QA fixture.                         | QA           |
| Inventory item           | `/inventory/item/:itemId`                       | Inventory item detail.                          | Inventory    |
| Inventory item edit      | `/inventory/item/:itemId/edit`                  | Edit custom inventory item.                     | Toolbox      |
| Inventory create         | `/inventory/create`                             | Create custom inventory item.                   | Toolbox      |
| Inventory manage         | `/inventory/manage`                             | Manage custom inventory items.                  | Toolbox      |
| Items create (legacy)    | `/items/create`                                 | Alternate item create path.                     | Toolbox      |
| Processes detail         | `/processes/:processId`                         | Process details page.                           | Processes    |
| Processes edit           | `/processes/:processId/edit`                    | Edit custom process.                            | Toolbox      |
| Processes create         | `/processes/create`                             | Create custom process.                          | Toolbox      |
| Processes manage         | `/processes/manage`                             | Manage custom processes.                        | Toolbox      |
| Process (legacy)         | `/process/:slug`                                | Legacy process route.                           | Processes    |
| Shop                     | `/shop`                                         | Shop index.                                     | More menu    |
| Shop buy                 | `/shop/buy/:itemId`                             | Buy an item.                                    | Shop         |
| Shop buy (count)         | `/shop/buy/:itemId/:count`                      | Buy with quantity.                              | Shop         |
| Shop buy (insufficient)  | `/shop/buy/:itemId/:count/insufficient_balance` | Insufficient balance.                           | Shop         |
| Shop sell                | `/shop/sell/:itemId`                            | Sell an item.                                   | Shop         |
| Shop sell (count)        | `/shop/sell/:itemId/:count`                     | Sell with quantity.                             | Shop         |
| Shop sell (insufficient) | `/shop/sell/:itemId/:count/insufficient_items`  | Insufficient items.                             | Shop         |
| Import                   | `/import/:newVersion/:oldVersion`               | Legacy save migration.                          | System       |
| Import complete          | `/import/:newVersion/:oldVersion/done`          | Migration complete.                             | System       |
| Profile avatar           | `/profile/avatar`                               | Avatar selection.                               | Profile      |
| Debug tools              | `/debug`                                        | Debug tools.                                    | Debug        |
| dChat (legacy)           | `/dchat`                                        | Legacy chat route.                              | Debug        |
| Skills                   | `/skills`                                       | Skills page.                                    | More menu    |
| Task                     | `/task`                                         | Task page.                                      | More menu    |
| Launch                   | `/launch`                                       | Launch page.                                    | More menu    |
| Cookie accept            | `/accept_cookies`                               | Cookie acceptance page.                         | System       |
| Cookie accepted          | `/accepted_cookies`                             | Cookie acceptance confirmation.                 | System       |
| 404                      | `/404`                                          | Error fallback page.                            | System       |

## Link-checker routing rules

The internal link checker resolves routes by mapping them to Astro files. See
`docs/ROUTES.md` for the full resolution rules used by `scripts/link-check.mjs`.
