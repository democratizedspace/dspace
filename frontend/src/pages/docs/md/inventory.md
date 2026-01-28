---
title: 'Inventory'
slug: 'inventory'
---

Your inventory contains items collected through quests, processes, and custom content. In v3,
inventory state persists locally in the IndexedDB-backed game state (with a localStorage fallback
when IndexedDB is unavailable), and you can manage items through the in-game inventory screens.

## Item categories

Inventory categories come from each item's `category` metadata. Built-in items are imported from
the JSON bundles under `frontend/src/pages/inventory/json/items/`, and any missing category values
are filled with defaults during import. Custom items created in the editor do not set a category,
so item cards label them as **Custom** or **Uncategorized** when no category is present.

## Inventory categories and filters

The `/inventory` page groups items into filterable categories so you can narrow down large lists.
Filter chips are derived directly from the categories present in the item data, so changing a
category means updating the JSON entries or custom item metadata.

- 3D Printing & Fabrication
- Aquarium
- Astronomy & Observation
- Awards
- Biology & Lab
- Digital & Records
- Digital Currency & Tokens
- Electronics & Robotics
- Energy & Power
- Hydroponics
- Rocketry & Flight
- Safety & Medical
- Tools
- Transportation
- Uncategorized
- Workshop & Construction

When adding a new category, update the relevant JSON entries and refresh the assertions in
`frontend/tests/inventory-items-import.test.ts` so the expected category set stays in sync.

## Item Properties

Each item record includes:

- Unique ID
- Name
- Description
- Image
- Optional metadata like price, unit, type, and dependencies

Inventory counts live in the game state and are displayed alongside item metadata.

## Item Relationships

Items are connected to the rest of the game through:

1. Processes
    - Required items (checked but not consumed)
    - Consumed items (removed when process starts)
    - Created items (added when process completes)

2. Quests
    - Requirements for dialogue options
    - Rewards for completion
    - Granted items during dialogue

## Custom Items

With v3, you can create custom items that:

- Can be used in custom processes
- Can be granted by custom quests
- Are stored locally by default
- Can be bundled with quests and processes for submission when you want to contribute them

## Item Management

The inventory interface allows you to:

- View item details and counts
- See related processes and quest references on each item detail page
- Define dependencies in the item editor and review them in item previews
- Manage custom items and preview them from the **Manage Items** page using
  the **Preview** button next to each entry
- Remove custom items you no longer need directly from this page

Inventory data is stored locally using IndexedDB, with localStorage used as a fallback when needed.
For cross-device backups, use [Cloud Sync](/docs/cloud-sync).

## Browser Support

Inventory storage uses the browser's IndexedDB implementation when available and falls back to
vendor-prefixed variants (`webkitIndexedDB`, `mozIndexedDB`, `msIndexedDB`) when present. If
IndexedDB is not available, the game state falls back to localStorage.
