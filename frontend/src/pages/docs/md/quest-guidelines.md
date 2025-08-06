---
title: 'Quest Development Guidelines'
slug: 'quest-guidelines'
---

# Quest Development Guidelines

This guide provides structured instructions for creating engaging, educational quests that align with DSPACE's mission to democratize space exploration through practical, hands-on learning experiences.

## Quest Philosophy

DSPACE quests should:

1. **Be grounded in reality** - Focus on projects people can actually build at home
2. **Follow logical progression** - Start with beginner-friendly content before advanced concepts
3. **Provide educational value** - Teach useful skills that connect to space exploration themes
4. **Emphasize sustainability** - Showcase environmentally responsible approaches
5. **Be scientifically accurate** - Present correct information with proper terminology

## Quest Categories

When creating quests, focus on these primary categories:

### Core Categories

- **Hydroponics**: Growing plants without soil, crucial for space habitation
- **Aquaria**: Managing aquatic ecosystems, modeling closed-loop life support
- **Aquaponics**: Combining fish and plant cultivation in symbiotic systems
- **Electronics**: Basic circuitry, sensing, and control systems
- **Energy Systems**: Solar, wind, batteries and sustainable power generation
- **3D Printing**: Fabrication techniques for creating components and tools

### Secondary Categories

- **Chemistry**: Safe experiments demonstrating principles relevant to space
- **Biology**: Experiments studying life in controlled environments
- **Physics**: Demonstrations of physical principles in space exploration
- **Astronomy**: Observational techniques and understanding celestial objects
- **Materials Science**: Testing and comparing materials for various applications

## Quest Structure Guidelines

### Progressive Difficulty

Organize quests in a **clear progression** from beginner to advanced:

1. **Entry Level** - Minimal equipment, very accessible, quick results
2. **Beginner** - Common household items or inexpensive purchases
3. **Intermediate** - More specialized equipment, longer timeframes
4. **Advanced** - Specialized equipment, technical knowledge, significant commitment

### Quest Dependencies

- Make dependencies clear and logical
- Each category should have a clear entry point
- Advanced quests should require completion of relevant prerequisites

## Content Guidelines

### Dialogue Best Practices

1. **Authentic Voice**: Each NPC should have a consistent personality
2. **Educational Tone**: Instructive without being condescending
3. **Technical Accuracy**: Use proper terminology and scientifically accurate information
4. **Clear Instructions**: Step-by-step guidance that's easy to follow
5. **Branching Options**: Provide meaningful choices where appropriate

### Safety First

- Always include appropriate safety warnings
- Recommend proper protective equipment when needed
- Never encourage dangerous activities or improper handling of materials

## Examples of Well-Structured Quest Sequences

### Aquaria Sequence (Example)

1. **Basic Guppy Tank** (Entry) - Simple setup for beginners
2. **Guppy Breeding** (Beginner) - Introduction to fish reproduction
3. **Walstad Method** (Intermediate) - Self-sustaining planted tank with shrimp
4. **Goldfish Keeping** (Advanced) - More demanding water parameters and filtration
5. **Aquaponics System** (Advanced) - Combining fish-keeping with plant production

### Hydroponics Sequence (Example)

1. **Basil Growing** (Entry) - Simple setup with minimal equipment
2. **Lettuce Production** (Beginner) - Leafy greens with basic monitoring
3. **Microgreens System** (Intermediate) - Fast-cycle crops with succession planting
4. **Strawberry Tower** (Intermediate) - Vertical growing systems
5. **Advanced Nutrient Management** (Advanced) - Precise monitoring and adjustment

### Electronics Sequence (Example)

1. **Basic Circuit** (Entry) - Simple LED circuit with battery
2. **Arduino Projects** (Beginner) - Programmed interactions
3. **Solar USB Charger** (Intermediate) - Energy harvesting application
4. **Home Energy Monitor** (Intermediate) - Sensing and data collection
5. **Automated Garden** (Advanced) - Integration of electronics with biology

## Quest Technical Requirements

### Required Fields

Every quest JSON file must include:

- `id`: Unique identifier following the pattern `category/name`
- `title`: Display title of the quest
- `description`: Brief description explaining the quest purpose
- `image`: Path to quest image
- `npc`: Path to NPC avatar image
- `start`: ID of the starting dialogue node
- `dialogue`: Array of dialogue nodes, each containing:
    - `id`: Node identifier
    - `text`: NPC's dialogue text
    - `options`: Array of player response options, including:
        - `type`: Action type (goto, finish, process, grantsItems)
        - `text`: Player's response text
        - `goto`: For type:goto, target node ID
        - `process`: For type:process, process ID
        - `requiresItems`: Optional items needed to select option
        - `grantsItems`: Optional items given when selecting option
        - `requiresGitHub`: Set to `true` to disable the option until a GitHub token is saved
- `rewards`: Items given upon quest completion
- `requiresQuests`: Array of quest IDs that must be completed first (select these in the quest form under **Quest Requirements**).
  Automated tests ensure these dependencies reference existing quests and avoid cycles.

### Current Implementation State

> **Note:** The full quest editing interface is still under development. The current implementation in `QuestForm.svelte` supports basic quest properties (title, description, image) with more complete dialogue editing planned for future updates.

While the user interface for editing complex dialogue trees is being developed, quests are currently created using JSON files or through the custom content API. The future implementation will include:
You can run `npm run generate-quest --template basic` (or `branching`) to scaffold a template JSON file with placeholder dialogue.

- Dialogue node creation and editing
- Process and item requirement selection
- Quest dependency management
- Preview functionality to test dialogue flow

### Testing Your Quest

Before submitting a quest, verify:

- All dialogue paths lead to completion
- Item grants and requirements function correctly
- Process integrations work as expected
- Educational content is accurate and clear
- Safety warnings are included where appropriate

## Contribution Workflow

1. Develop your quest locally following these guidelines (start with `npm run generate-quest --template basic` for a ready-made template)
2. Test thoroughly in your local environment
3. Submit a [pull request](https://github.com/democratizedspace/dspace/pulls) with your quest JSON file
4. Respond to feedback during code review
5. Once approved, your quest will be merged into the official game

Once the in-game editor is complete, the workflow will be simplified to:

1. Create quest through the in-game interface
2. Test using the built-in preview feature
3. Submit for review directly through the game
4. Receive feedback through the platform
5. Once approved, quest becomes available to all players

## Areas Needing More Content

We're particularly interested in new quests that cover:

- Sustainable energy systems
- Small-scale biology experiments
- Chemistry demonstrations relevant to space exploration
- Sensor systems and data collection
- Resource recycling and waste management
- Low-cost astronomy projects
- Materials testing experiments

By following these guidelines, you'll create quests that engage players while advancing DSPACE's mission of democratizing space exploration through practical, hands-on education.
