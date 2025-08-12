---
title: 'Inventory'
slug: 'inventory'
---

Your inventory contains all the items you've collected through quests, processes, and other activities. Starting with v3, items are stored locally and can be managed through the inventory interface.

## Item Types

Items in DSPACE fall into several categories:

1. Resources

    - Energy units (dWatt, dSolar)
    - Currency (dUSD)
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

## Item Properties

Each item has:

-   Unique ID
-   Name
-   Description
-   Image
-   Count (quantity in inventory)
-   Related processes (requires/consumes/creates)

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

-   Can be used in custom processes
-   Can be granted by custom quests
-   Are stored locally by default
-   Can be contributed to the base game

## Item Management

The inventory interface allows you to:

-   View item details and counts
-   See related processes
-   Track item dependencies using the new `dependencies` field
-   Manage custom items and preview them from the **Manage Items** page using
    the **Preview** button next to each entry
-   Remove custom items you no longer need directly from this page

All inventory data is now stored locally using IndexedDB. For cross-device backups you can use the new [Cloud Sync](/cloudsync) feature.

## Browser Support

IndexedDB functionality has been verified in the latest versions of Chrome,
Firefox, Safari and Edge. DSPACE automatically falls back to vendor-prefixed
implementations when needed, ensuring consistent inventory storage across major
browsers.
