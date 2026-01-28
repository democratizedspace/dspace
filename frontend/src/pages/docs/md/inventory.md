---
title: 'Inventory'
slug: 'inventory'
---

Your inventory contains the items your game state has collected from quests, processes, and
shop actions. In v3, inventory data is stored locally in the browser and managed through the
Inventory and Manage Items screens.

## Item Types

Items in DSPACE cover a mix of resources, tools, components, and consumables. Examples from the
built-in catalog include:

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

The `/inventory` page groups items into filterable categories derived directly from the item JSON
catalog (`frontend/src/pages/inventory/json/items/`). The filters are not hardcoded; adding or
renaming a category only requires updating the item data.

Current built-in categories include:

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

Custom items created through the inventory form default to the **Custom** category. The Manage
Items screen also falls back to **Uncategorized** for any entries without an explicit category so
filters stay usable.

## Item Properties

Each item includes:

- Unique ID
- Name
- Description
- Image
- Count (quantity in inventory)
- Category
- Optional price/unit/type metadata
- Optional dependencies list (shown in the Manage Items preview)

## Item Relationships

Items can be tied to processes and quests. The item detail view (`/inventory/item/[itemId]`) shows
processes that require, consume, or create the item, along with quests where the item is required
or rewarded.

## Custom Items

Custom items are created at `/inventory/create`, stored in the custom content database, and merged
into the main catalog at runtime. They can be used in custom processes, granted by custom quests,
and edited or removed from `/inventory/manage`.

## Item Management

The inventory interface allows you to:

- View item details and counts
- Browse category filters and search results
- Jump from an item to related processes or quests
- Manage custom items with previews, edits, and deletes from **Manage Items**

## Storage and Sync

Inventory counts live in the game state, which persists in IndexedDB and falls back to
localStorage if IndexedDB is unavailable. Custom items are stored in the custom content database,
which also relies on IndexedDB with an in-memory fallback.

For cross-device backups, use [Cloud Sync](/docs/cloud-sync) to upload your save data (including
custom items, quests, and processes) to a private GitHub gist.
