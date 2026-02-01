---
title: 'Routes'
slug: 'routes'
---

# Routes

This page mirrors the canonical route inventory in `docs/ROUTES.md` so the /docs/routes
content is directly retrievable for chat and RAG searches. All paths below are rendered
verbatim for internal linking.

## Quick reference (content tools)

- /quests/manage
- /quests/create
- /inventory/manage
- /inventory/create
- /processes/manage
- /processes/create
- /contentbackup
- /gamesaves

## Canonical route index

### Core Pages

- / - Homepage (index.astro)
- /404 - 404 error page
- /settings - User settings
- /stats - User statistics
- /skills - Skills page
- /task - Task page
- /launch - Launch page
- /changelog - Changelog page

### Cookie Management

- /accept_cookies - Cookie acceptance page
- /accepted_cookies - Cookie acceptance confirmation

### Profile & Achievements

- /profile - User profile page
- /profile/avatar - Avatar selection
- /achievements - User achievements page
- /titles - User titles page
- /leaderboard - Global leaderboard

### Game Systems

- /energy - Energy management page
- /gamesaves - Game save import/export
- /cloudsync - Cloud synchronization
- /contentbackup - Content backup management

### Chat & Debug

- /chat - Chat interface
- /dchat - dChat interface (AI assistant)
- /debug - Debug tools

### Documentation

- /docs - Documentation index
- /docs/[slug] - Individual documentation pages
    - Examples: /docs/about, /docs/solar, /docs/team, /docs/processes

### Inventory

- /inventory - Inventory list
- /inventory/create - Create new item
- /inventory/manage - Manage inventory
- /inventory/item/[itemId] - Individual item details
    - Examples: /inventory/item/1, /inventory/item/37, /inventory/item/50
- /inventory/item/[itemId]/edit - Edit custom item
    - Examples: /inventory/item/1/edit, /inventory/item/37/edit, /inventory/item/50/edit

### Items (Alternative Inventory Routes)

- /items/create - Create new item (alternative path)

### Processes

- /process/[slug] - Process by slug (legacy pattern)
- /processes - Processes list
- /processes/[processId] - Individual process details
    - Examples: /processes/launch-rocket, /processes/feed-goldfish
- /processes/create - Create new process
- /processes/manage - Manage processes

### Quests

- /quests - Quest list
- /quests/create - Create new quest
- /quests/manage - Manage quests
- /quests/review - Review quests
- /quests/submit - Submit quest
- /quests/[id] - Quest by ID (simple pattern)
- /quests/fixtures/ancestor-highlights - Quest graph fixture used for ancestor/descendant QA
- /quests/[id]/edit - Edit quest by ID
- /quests/[pathId]/[questId] - Quest by path and ID (nested pattern)
    - Examples: /quests/play/2, /quests/custom/5
- /quests/[pathId]/[questId]/edit - Edit nested quest
- /quests/[pathId]/[questId]/finished - Quest completion page

### Shop

- /shop - Shop index
- /shop/buy/[itemId] - Buy item page
- /shop/buy/[itemId]/[count] - Buy specific quantity
- /shop/buy/[itemId]/[count]/insufficient_balance - Insufficient balance error
- /shop/sell/[itemId] - Sell item page
- /shop/sell/[itemId]/[count] - Sell specific quantity
- /shop/sell/[itemId]/[count]/insufficient_items - Insufficient items error

### Import/Migration

- /import/[newVersion]/[oldVersion] - Import from old version
- /import/[newVersion]/[oldVersion]/done - Import completion

### Route resolution notes

The link checker resolves internal paths without starting the server:

1. Exact match: /inventory → `frontend/src/pages/inventory/index.astro`
2. Index pattern: /quests → `frontend/src/pages/quests/index.astro`
3. Slug pattern: /docs/about → `frontend/src/pages/docs/[slug].astro`
4. ID pattern: /quests/1 → `frontend/src/pages/quests/[id].astro`
5. Nested dynamic: /quests/play/2 → `frontend/src/pages/quests/[pathId]/[questId].astro`
6. Parameterized: /inventory/item/37 → `frontend/src/pages/inventory/item/[itemId]/index.astro`
