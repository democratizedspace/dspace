---
title: 'Quest Development Guidelines'
slug: 'quest-guidelines'
---

# Quest Development Guidelines

This guide provides structured instructions for creating engaging, educational quests that align
with DSPACE's mission to democratize space exploration through practical, hands-on learning
experiences. Start with the
[Quest Template Example](/docs/quest-template) and consult the
[Quest Schema Requirements](/docs/quest-schema) for field definitions. When your quest is ready,
follow the [Quest Contribution Guidelines](/docs/quest-contribution) and the
[Quest Submission Guide](/docs/quest-submission) to share it with the community. For an overview of
existing quest categories, see [Quest Trees](/docs/quest-trees).

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

-   **Hydroponics**: Growing plants without soil, crucial for space habitation
-   **Aquaria**: Managing aquatic ecosystems, modeling closed-loop life support
-   **Aquaponics**: Combining fish and plant cultivation in symbiotic systems
-   **Electronics**: Basic circuitry, sensing, and control systems
-   **Energy Systems**: Solar, wind, batteries and sustainable power generation
-   **3D Printing**: Fabrication techniques for creating components and tools

### Secondary Categories

-   **Chemistry**: Safe experiments demonstrating principles relevant to space
-   **Biology**: Experiments studying life in controlled environments
-   **Physics**: Demonstrations of physical principles in space exploration
-   **Astronomy**: Observational techniques and understanding celestial objects
-   **Materials Science**: Testing and comparing materials for various applications

## Quest Structure Guidelines

### Progressive Difficulty

Organize quests in a **clear progression** from beginner to advanced:

1. **Entry Level** - Minimal equipment, very accessible, quick results
2. **Beginner** - Common household items or inexpensive purchases
3. **Intermediate** - More specialized equipment, longer timeframes
4. **Advanced** - Specialized equipment, technical knowledge, significant commitment

### Quest Dependencies

-   Make dependencies clear and logical
-   Only `welcome/howtodoquests` should have an empty `requiresQuests` list. All other quests must
    depend on it directly or on a downstream quest so new players always learn the mechanics first.
    This rule is enforced by automated repository tests to prevent regressions.
-   Each category should have a clear entry point that chains back to `welcome/howtodoquests`.
-   Dependencies should mirror the real learning path (e.g., rocketry quests rely on 3D printing and
    electronics basics; robotics builds on electronics and programming fundamentals).
-   Advanced quests should require completion of relevant prerequisites

## Content Guidelines

### Dialogue Best Practices

1. **Authentic Voice**: Each NPC should have a consistent personality
2. **Educational Tone**: Instructive without being condescending
3. **Technical Accuracy**: Use proper terminology and scientifically accurate information
4. **Clear Instructions**: Step-by-step guidance that's easy to follow
5. **Branching Options**: Provide meaningful choices where appropriate

### Safety First

-   Always include appropriate safety warnings
-   Recommend proper protective equipment when needed
-   Never encourage dangerous activities or improper handling of materials

### Process Duration Realism

-   Processes introduce time-based play and should reflect real-world timing. Quick setup actions
    (plugging in a smart plug, scanning a barcode, initiating a download) should resolve in seconds,
    while longer projects scale sensibly (filling a bucket in under a minute, printing a Benchy in a
    couple of hours, growing a plant over weeks).
-   When quests reference processes, double-check durations against the real task to keep the
    experience grounded and avoid multi-hour waits for introductory tutorials.

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

-   `id`: Unique identifier following the pattern `category/name`
-   `title`: Display title of the quest
-   `description`: Brief description explaining the quest purpose
-   `image`: Path to quest image
-   `npc`: Path to NPC avatar image (choose from the NPC list in [/docs/npcs](/docs/npcs))
-   `start`: ID of the starting dialogue node
-   `dialogue`: Array of dialogue nodes, each containing:
    -   `id`: Node identifier
    -   `text`: NPC's dialogue text
    -   `options`: Array of player response options, including:
        -   `type`: Action type (goto, finish, process, grantsItems)
        -   `text`: Player's response text
        -   `goto`: For type:goto, target node ID
        -   `process`: For type:process, process ID
        -   `requiresItems`: Optional items needed to select option
        -   `grantsItems`: Optional items given when selecting option
        -   `requiresGitHub`: Set to `true` to disable the option until a GitHub token is saved
-   `rewards`: Items given upon quest completion
-   `requiresQuests`: Array of quest IDs that must be completed first (select these in the quest form under **Quest Requirements**).
    Automated tests ensure these dependencies reference existing quests and avoid cycles.

Quest data is validated against a JSON schema. Titles and descriptions reject
`<` and `>` characters, and `image` must be a data URL, an absolute HTTP(S)
link, or a root-relative path. Quest titles must be unique across all existing
quests.

### Current Implementation State (In-Game Editor)

The live quest editor at [/quests/create](/quests/create) reflects the `QuestForm.svelte` behavior.
When you create a quest in-game, you will:

1. **Enter metadata** — title (min 3 characters) and description (min 10 characters).
2. **Pick an NPC** — choose a known NPC (or type a custom value) to set the `npc` avatar.
3. **Set a quest image** — upload an image to generate a downsampled JPEG data URL, or keep the
   default fallback image. Uploaded images are resized to a square (default 512px) and compressed
   to target ~50KB for IndexedDB storage.
4. **Define dialogue nodes** — each node needs a unique ID, text, and at least one option.
5. **Choose option types** — options can `goto` another node, `finish` the quest, `process` a
   process ID, or `grantsItems`. Options can also `requiresItems` to gate choices.
6. **Select requirements and rewards** — use **Quest Requirements** for `requiresQuests`, and the
   rewards panel for completion rewards.
7. **Pick a start node** — the start node must exist in the dialogue set.
8. **Preview + save** — use Preview to validate flow, then save.

The editor validates quest dependencies against the built-in quest list and enforces unique titles.
The same form powers the edit route at [/quests/[id]/edit](/quests/[id]/edit), which loads quest
data from the custom content database.

### Storage and Persistence (Custom Quests)

Custom quests are stored locally in the **CustomContent** IndexedDB database, in the `quests`
object store. Each quest is saved with a generated UUID, `custom: true`, and timestamps
(`createdAt`/`updatedAt`). If IndexedDB is unavailable, the editor falls back to an in-memory map,
so custom quests will be lost on refresh or tab close.

Built-in quests are not stored in CustomContent, so only custom quests can be edited or deleted
from the manage flow. Use the custom content backup tools at
[/contentbackup](/contentbackup) to export or restore local quests.

### Testing Your Quest

Before submitting a quest, verify:

-   All dialogue paths lead to completion
-   Item grants and requirements function correctly
-   Process integrations work as expected
-   Educational content is accurate and clear
-   Safety warnings are included where appropriate

## Contribution Workflow

### Preferred: In-game editor submission

1. Use the in-game editor from the **Play → Manage Quests** menu to create or edit your quest.
2. Test using the built-in preview feature to confirm dialogue flow and reward logic.
3. Click **Submit** to open an authenticated pull request directly from the game.
4. Track review feedback in the linked GitHub pull request and iterate in the editor.
5. Once approved, the quest deploys to all players automatically.

### Manual JSON contribution

1. Develop your quest locally following these guidelines. Start with
   `npm run generate-quest --template basic` for a ready-made template.
2. Test thoroughly in your local environment.
3. Submit a [pull request](https://github.com/democratizedspace/dspace/pulls) with your quest JSON file.
4. Respond to feedback during code review.
5. Once approved, your quest will be merged into the official game.

## Areas Needing More Content

We're particularly interested in new quests that cover:

-   Sustainable energy systems
-   Small-scale biology experiments
-   Chemistry demonstrations relevant to space exploration
-   Sensor systems and data collection
-   Resource recycling and waste management
-   Low-cost astronomy projects
-   Materials testing experiments

By following these guidelines, you'll create quests that engage players while advancing DSPACE's mission of democratizing space exploration through practical, hands-on education.
