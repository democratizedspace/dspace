---
title: 'Inventory'
slug: 'inventory'
---

Your inventory contains all the items you've collected through quests, processes, and other activities. Starting with v3, items are stored locally and can be managed through the inventory interface.

## Item Types

Items in DSPACE fall into categories that also drive the filters on the Inventory page:

- 3D Printing (filament, prints, fixtures)
- Aquarium (fish and aquatic plants)
- Astronomy & Optics (telescopes, charts, lenses)
- Awards (achievement badges and tokens)
- Computing & Networking (Raspberry Pi, storage, networking gear)
- Digital Assets & Software (dUSD, dCarbon, dChat, repos)
- Electronics & Robotics (Arduino, LEDs, sensors, motors)
- Energy & Power (solar, wind, batteries, chargers)
- Gardening & Botany (stevia plants and harvests)
- Hydroponics (kits, grow towers)
- Lab Supplies (beakers, acids, lab safety basics)
- Media & Documentation (logbooks, cameras, printed media)
- Model Rocketry (airframes, avionics, firmware, parachutes)
- Safety & Medical (first aid and PPE)
- Smart Home & IoT (smart plugs and strips)
- Tools (machine shop tools)
- Transportation (EVs)
- Workshop & Woodworking (workbenches, saws, pine projects)

## Item Properties

Each item has:

- Unique ID
- Name
- Description
- Image
- Count (quantity in inventory)
- Related processes (requires/consumes/creates)

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
- Are stored locally by default
- Can be contributed to the base game

## Item Management

The inventory interface allows you to:

- View item details and counts
- See related processes
- Track item dependencies using the new `dependencies` field
- Manage custom items and preview them from the **Manage Items** page using
  the **Preview** button next to each entry
- Remove custom items you no longer need directly from this page

All inventory data is now stored locally using IndexedDB. For cross-device backups you can use the new [Cloud Sync](/docs/cloud-sync) feature.

## Browser Support

IndexedDB functionality has been verified in the latest versions of Chrome,
Firefox, Safari and Edge. DSPACE automatically falls back to vendor-prefixed
implementations when needed, ensuring consistent inventory storage across major
browsers.
