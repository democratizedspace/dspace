---
title: 'Inventory'
slug: 'inventory'
---

Your inventory tracks the items you've collected through quests and processes, plus anything you add
with the custom item tools. In v3, inventory and custom content are stored locally in your
browser. Inventory saves use IndexedDB with a localStorage fallback, while custom content falls back
to an in-memory store if IndexedDB is unavailable.

## Item categories

Inventory items are organized by category in the canonical item catalog. Categories are defined by
the item schema and assigned in the JSON files under `frontend/src/pages/inventory/json/items/`.
Each item can declare a category, and files without a category inherit a default value in the item
index.

## Inventory filters

The `/inventory` page groups items into filterable categories so you can narrow down large lists
quickly. The filter chips are derived directly from the item data (no hardcoded lists), so adding or
renaming a category only requires updating the items themselves.

- 3D Printing & Fabrication
- Astronomy & Observation
- Biology & Lab
- Digital & Records
- Digital Currency & Tokens
- Electronics & Robotics
- Energy & Power
- Rocketry & Flight
- Safety & Medical
- Transportation
- Workshop & Construction
- Plus existing categories for Aquarium, Awards, Hydroponics, and Tools

Items missing an explicit category fall back to the "Uncategorized" label in the UI. When adding a
new category, update the relevant JSON entries and refresh the assertions in
`frontend/tests/inventory-items-import.test.ts` so the expected category set stays in sync.

## Item properties

Each item record includes:

- Unique ID
- Name
- Description
- Image
- Optional metadata like `price`, `unit`, `type`, `category`, and `dependencies`

Counts live in the game state inventory, not on the item definitions themselves.

## Item relationships

Items are interconnected through:

1. Processes
    - Required items (checked but not consumed)
    - Consumed items (removed when process starts)
    - Created items (added when process completes)

2. Quests
    - Requirements for dialogue options
    - Rewards for completion
    - Granted items during dialogue

## Custom items

Custom items can be created from `/inventory/create` and are stored locally in the custom content
database (IndexedDB with an in-memory fallback if IndexedDB is unavailable). Custom items can be
referenced by custom processes and quests.

## Item management

The inventory interface allows you to:

- View item details and counts
- Search, sort, and filter the inventory list by category
- Jump to an item's detail page to see related processes and quests
- Manage custom items on **Manage Items**, including previewing details and deleting custom entries

Inventory data is stored locally (IndexedDB with a localStorage fallback). For cross-device backups
you can enable [Cloud Sync](/docs/cloud-sync).

## Browser support

DSPACE uses IndexedDB in modern browsers and falls back to vendor-prefixed implementations where
available. If IndexedDB is unavailable, the game falls back to localStorage and warns that storage
may be limited.
