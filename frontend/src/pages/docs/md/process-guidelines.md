---
title: 'Process Development Guidelines'
slug: 'process-guidelines'
---

# Process Development Guidelines

This guide provides structured instructions for creating processes in DSPACE. Well-designed processes form the backbone of the game's crafting and progression systems, connecting items to educational concepts and gameplay.

## Process Philosophy

DSPACE processes should:

1. **Reflect real-world activities** - Based on actual scientific or engineering procedures
2. **Have educational value** - Teach concepts relevant to space exploration
3. **Balance time investment** - Duration should match the complexity and value of outcome
4. **Create meaningful relationships** - Connect items in logical chains of production
5. **Support game progression** - Help players advance through increasingly complex systems

## Process Structure

### Core Properties

Every process requires the following properties:

-   **title**: Clear, descriptive name for the process (required)
-   **duration**: Time required to complete the process in format `#h #m` (required)
-   **requireItems**: Items needed but not consumed (optional)
-   **consumeItems**: Items removed from inventory when process starts (optional)
-   **createItems**: Items added to inventory when process completes (optional)

At least one of `requireItems`, `consumeItems`, or `createItems` must be specified for a process to be useful.

### Duration Format

Duration must follow the pattern `(\d+h\s*)?(\d+m\s*)?(\d+s\s*)?`, for example:

-   "30m" (30 minutes)
-   "2h" (2 hours)
-   "1h 30m" (1 hour, 30 minutes)
-   "5m 30s" (5 minutes, 30 seconds)

Fractional values are allowed, so `0.5h` will be interpreted as thirty minutes.

### Implementation State

The current `ProcessForm.svelte` component supports creating processes with all the properties listed above. It includes item selection interfaces for each of the three item relationship types. A built-in preview shows how the process will appear once created, and form validation now accepts seconds and fractional durations in addition to hours and minutes. The form is also mobile-friendly with controls stacked vertically on small screens.

### Preview & Testing

Use the **Preview** button to inspect your process before saving. Our automated Playwright tests now verify that the preview renders correctly when valid data is provided.

## Process Categories

When designing processes, consider these common categories:

### Manufacturing Processes

-   **3D Printing**: Creating physical components from digital designs
-   **Assembly**: Combining components into more complex systems
-   **Recycling**: Converting waste materials into usable resources

### Biological Processes

-   **Plant Cultivation**: Growing plants for food, oxygen, or research
-   **Aquaculture**: Raising aquatic organisms
-   **Composting**: Creating nutrients from organic waste

### Energy Processes

-   **Generation**: Creating energy from renewable sources
-   **Storage**: Storing energy for later use
-   **Conversion**: Transforming energy between forms

### Educational Processes

-   **Experimentation**: Scientific tests and demonstrations
-   **Simulation**: Virtual modeling of space phenomena
-   **Analysis**: Data examination and interpretation

## Process Design Best Practices

### Balancing Time and Reward

-   Process duration should correlate with the value of created items
-   Consider educational value when determining time requirements
-   Allow shorter processes to chain into longer progression paths

### Item Relationships

-   Ensure logical connections between required/consumed items and outputs
-   Create process chains where outputs become inputs for more advanced processes
-   Consider physical conservation of materials (input mass roughly equals output mass)

### Educational Components

-   Include realistic time scales when appropriate
-   Model actual procedures used in space exploration
-   Demonstrate scientific principles through process outcomes

## Example Processes

### Basic Manufacturing Process

```json
{
    "title": "3D Print Solar Panel Mount",
    "duration": "2h 15m",
    "requireItems": [{ "id": "3d-printer", "count": 1 }],
    "consumeItems": [
        { "id": "pla-filament", "count": 250 },
        { "id": "dwatt", "count": 450 }
    ],
    "createItems": [{ "id": "solar-panel-mount", "count": 1 }]
}
```

### Biological Process

```json
{
    "title": "Grow Lettuce Hydroponically",
    "duration": "14d",
    "requireItems": [
        { "id": "hydroponic-system", "count": 1 },
        { "id": "grow-light", "count": 1 }
    ],
    "consumeItems": [
        { "id": "lettuce-seed", "count": 5 },
        { "id": "nutrient-solution", "count": 2 },
        { "id": "dwatt", "count": 3360 }
    ],
    "createItems": [{ "id": "lettuce", "count": 5 }]
}
```

### Energy Process

```json
{
    "title": "Generate Solar Power",
    "duration": "1h",
    "requireItems": [{ "id": "solar-panel-100w", "count": 1 }],
    "consumeItems": [],
    "createItems": [
        { "id": "dwatt", "count": 100 },
        { "id": "dsolar", "count": 100 }
    ]
}
```

## Process States

Processes go through several states during their lifecycle:

1. **NOT_STARTED**: Process is defined but hasn't been initiated
2. **IN_PROGRESS**: Process is currently running, countdown is active
3. **FINISHED**: Process has completed and is ready for collection

The UI displays different controls depending on the state:

-   NOT_STARTED: "Start" button
-   IN_PROGRESS: Progress bar, "Cancel" button
-   FINISHED: "Collect" button

## Contribution Workflow

1. Develop your custom process(es) following these guidelines
2. Test with appropriate items to ensure correct behavior
3. Submit a pull request with your process JSON file
4. Respond to feedback during code review
5. Once approved, your process will be merged into the official game

Once the full in-game editor is complete, the workflow will be simplified:

1. Create process through the in-game interface
2. Test with required items
3. Submit for review directly through the game
4. Receive feedback through the platform
5. Once approved, process becomes available to all players

## Process Chains and Progression

One of the most effective ways to design processes is to think in terms of chains:

1. **Basic Resource Collection**: Simple processes that generate fundamental resources
2. **Primary Processing**: Converting basic resources into useful materials
3. **Component Creation**: Manufacturing individual parts from processed materials
4. **System Assembly**: Combining components into functional systems
5. **Advanced Applications**: Using completed systems for high-level functions

When designing process chains, consider how they support the educational goals of DSPACE and guide players through increasingly complex concepts relevant to space exploration.

By following these guidelines, you'll create processes that enhance gameplay while advancing DSPACE's mission of democratizing space exploration through practical, hands-on education.
