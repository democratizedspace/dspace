---
title: 'Routes'
slug: 'routes'
---

This page mirrors the canonical routes index in `docs/ROUTES.md` and is intended for quick
reference in the UI. All routes below are listed explicitly so navigation guidance can be cited
verbatim.

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
