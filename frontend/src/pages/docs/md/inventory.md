---
title: 'Inventory'
slug: 'inventory'
---

Your inventory contains all the items you've collected through quests, processes, purchases, and
other activities. In v3, inventory counts are stored in your browser using IndexedDB when it is
available, with a localStorage fallback if IndexedDB is unavailable.

## Item Types

Items in DSPACE fall into several types pulled from the current item catalog:

1. Resources
    - Energy units ([dWatt](/docs/dwatt), [dSolar](/docs/solar))
    - Currency ([dUSD](/docs/dusd))
    - Raw materials (PLA filament, water)

2. Tools and Equipment
    - 3D printers
    - Solar panels and batteries
    - Aquarium equipment
    - Hydroponics systems

3. Components
    - 3D printed parts
    - Rocket components
    - Electronic components

4. Consumables
    - Plant nutrients
    - Fish food
    - Rocket fuel

## Inventory categories and filters

The `/inventory` page groups items into filterable categories so you can narrow down large lists
quickly. Categories are defined in the item JSON data under
`frontend/src/pages/inventory/json/items/`. The filter chips are derived directly from the loaded
item catalog (built-in JSON plus any custom items), so category changes flow through without
additional hardcoded lists.

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

Items missing an explicit category fall back to the "Uncategorized" label in the UI. Custom items
default to the "Custom" category unless you supply a different one. When adding a new built-in
category, update the relevant JSON entries and refresh the assertions in
`frontend/tests/inventory-items-import.test.ts` so the expected category set stays in sync.

## Item Properties

Each item definition includes:

- Unique ID
- Name
- Description
- Image
- Price and unit (when tradeable)
- Type and category metadata
- Optional dependencies list

Inventory counts live in your save data and are rendered alongside each item.

## Item Relationships

Items are interconnected through:

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
- Are stored locally in the custom content database (with an in-memory fallback if IndexedDB is
  unavailable)
- Can be exported via `/contentbackup` for sharing or submission

## Item Management

The inventory interface allows you to:

- View item details and counts
- Filter by category, search by name/description/price, and sort by name, price, or count
- Toggle "Show all items" to include zero-count entries
- See related processes and quest links on the item detail page
- Preview custom item metadata (including dependencies) from the **Manage Items** page
- Remove custom items you no longer need directly from the **Manage Items** page

Inventory counts are stored locally using IndexedDB when available, with a localStorage fallback if
needed. Custom items, quests, and processes use the IndexedDB-backed custom content database with an
in-memory fallback. For cross-device backups you can use [Cloud Sync](/docs/cloud-sync) or export a
custom content bundle from [/contentbackup](/contentbackup).

## Browser Support

IndexedDB functionality is used for both game saves and custom content when the browser supports it.
If IndexedDB is unavailable, inventory counts fall back to localStorage and custom content falls
back to an in-memory store.
