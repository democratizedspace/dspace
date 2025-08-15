---
title: 'Item Development Guidelines'
slug: 'item-guidelines'
---

# Item Development Guidelines

This guide provides structured instructions for creating and managing custom items in DSPACE. Well-designed items enhance the game experience and expand the capabilities of processes and quests.

## Item Philosophy

DSPACE items should:

1. **Serve a purpose** - Connect to processes, quests, or educational concepts
2. **Be realistic** - Represent objects that could exist in a space exploration context
3. **Have clear relationships** - Establish connections to other game elements
4. **Follow naming conventions** - Use consistent, descriptive terminology
5. **Include educational value** - Teach concepts relevant to space exploration

## Item Categories

When creating items, consider these categories:

### Core Item Types

-   **Resources**: Basic materials like energy units (dWatt), currency (dUSD), raw materials
-   **Tools & Equipment**: Devices used to perform processes (3D printers, sensors, etc.)
-   **Components**: Parts used in constructing larger systems (rocket parts, circuit boards)
-   **Consumables**: Items that get used up through processes (fuel, nutrients, filament)
-   **Educational**: Items that provide information or learning opportunities

## Item Structure Guidelines

### Basic Properties

Every item requires the following basic properties:

-   **name**: Descriptive name of the item (required)
-   **description**: Detailed explanation of the item's purpose and use (required)
    -   **image**: Visual representation of the item (required)
-   **price**: Value in game currency (optional)
-   **unit**: Measurement unit for the item (e.g., kg, L, watts) (optional)
-   **type**: Classification or category (optional)

### Implementation State

Currently, the `ItemForm.svelte` component supports creating and editing items with the properties listed above. It uploads images, persists data to IndexedDB, and focuses on the fundamental aspects of items, with more advanced features planned for future updates.

As you fill out the form, an `ItemPreview` component displays a live preview so you can
confirm the details before submitting. The layout automatically adjusts on small screens
so form fields expand to the full width for easier touch input, and action buttons stack
vertically on narrow displays. You can safely experiment with different values before
saving—no data is written until you click **Create Item**.

The form provides inline validation messages if you attempt to submit without a name, description, or image, helping ensure items meet basic requirements before saving. Automated Playwright tests verify that the preview appears when entering text and that uploaded images render correctly. This ensures cross-browser compatibility of the custom item workflow.

All items must now conform to the JSON schema located at `frontend/src/pages/inventory/jsonSchemas/item.json`. Run the `itemValidation` test to ensure any additions meet the schema requirements.

## Item Best Practices

### Naming Conventions

1. **Be specific** - "Solar Panel (5W)" is better than "Solar Panel"
2. **Include measurements** - Add units when relevant (e.g., "Water Tank (10L)")
3. **Use standard terminology** - Research proper terms for scientific concepts

### Descriptions

1. **Explain purpose** - What the item is used for
2. **Include educational content** - Brief facts about real-world equivalents
3. **Connect to space context** - How the item relates to space exploration
4. **Keep it concise** - 1-3 sentences is usually sufficient

### Images

1. **Clear representation** - Should clearly show what the item is
2. **Consistent style** - Match the visual style of existing items
3. **Appropriate format** - Use PNG or JPG format, sized appropriately
4. **Attribution** - Include credits for images if required

## Item Relationships

Items in DSPACE are often connected to other game elements:

### Process Relationships

-   **Required by**: Processes that need this item to run but don't consume it
-   **Consumed by**: Processes that use up this item
-   **Created by**: Processes that produce this item

### Quest Relationships

-   **Required for**: Quest dialogue options that need this item
-   **Granted by**: Quests that give this item as a reward or during dialogue

When creating custom items, consider how they might connect to:

1. Existing processes
2. Existing quests
3. New processes you're developing
4. New quests you're developing

## Examples

### Resource Example

```json
{
    "name": "Recycled Aluminum (100g)",
    "description": "Lightweight aluminum recovered from waste materials. Used in manufacturing various components for space habitats.",
    "image": "/assets/recycled-aluminum.jpg",
    "price": "15",
    "unit": "100g",
    "type": "resource"
}
```

### Tool Example

```json
{
    "name": "Multimeter",
    "description": "A device for measuring electrical voltage, current, and resistance. Essential for testing and troubleshooting electronic circuits.",
    "image": "/assets/launch_controller.jpg",
    "price": "250",
    "unit": "unit",
    "type": "tool"
}
```

### Component Example

```json
{
    "name": "Solar Cell Junction Box",
    "description": "A protective enclosure for solar panel electrical connections. Shields connections from moisture and environmental damage.",
    "image": "/assets/junction-box.jpg",
    "price": "45",
    "unit": "unit",
    "type": "component"
}
```

## Contribution Workflow

1. Develop your custom item(s) following these guidelines
2. Test the item(s) in various processes to ensure they function as expected
3. Submit a pull request with your item JSON file
4. Respond to feedback during code review
5. Once approved, your item will be merged into the official game

Once the full in-game editor is complete, the workflow will be simplified:

1. Create item through the in-game interface
2. Test in custom processes
3. Submit for review directly through the game
4. Receive feedback through the platform
5. Once approved, item becomes available to all players

## Areas Needing More Content

We're particularly interested in new items that cover:

-   Sustainable materials and recycling
-   Energy storage and generation
-   Life support systems
-   Scientific instruments
-   Plant cultivation tools
-   Water management systems
-   Educational models and demonstrations

By following these guidelines, you'll create items that enhance gameplay while advancing DSPACE's mission of democratizing space exploration through education.
