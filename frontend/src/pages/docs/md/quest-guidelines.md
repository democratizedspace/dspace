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

Align new quests with the **current quest trees** shipped in DSPACE. If you are proposing a brand
new tree, call it out explicitly in your pull request so reviewers can confirm scope and pacing.

Current quest trees:

-   **Welcome**: onboarding tutorial for how quests work
-   **3D Printing**: printer setup, calibration, and maintenance
-   **Aquaria**: aquarium setup, maintenance, and fish care
-   **Astronomy**: observing the night sky and tracking celestial objects
-   **Chemistry**: safe, foundational experiments with clear safety guidance
-   **Composting**: compost setup, maintenance, and use
-   **DevOps**: self-hosting, automation, and operations workflows
-   **Electronics**: circuits, sensors, and microcontroller basics
-   **Energy**: renewable power, storage, and measurement
-   **First Aid**: safety preparedness and basic care
-   **Geothermal**: monitoring and maintaining geothermal systems
-   **Hydroponics**: growing plants in water-based systems
-   **Programming**: data logging, scripts, and automation
-   **Robotics**: servo control, chassis builds, and automation
-   **Rocketry**: model rocket design, printing, and launch steps
-   **Sysadmin**: foundational Linux workflows and maintenance
-   **UBI**: metaguild and basic-income concepts
-   **Woodworking**: tooling, safety, and build projects
-   **Completionist**: meta quests that track overall progress

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
        -   `type`: Action type (`goto`, `finish`, `process`, or `grantsItems`)
        -   `text`: Player's response text
        -   `goto`: For `type: "goto"`, the target node ID
        -   `process`: For `type: "process"`, the process ID
        -   `requiresItems`: Optional items needed to select the option
        -   `grantsItems`: Items granted when `type: "grantsItems"`
        -   `requiresGitHub`: Set to `true` to disable the option until a GitHub token is saved
-   `rewards`: Items given upon quest completion
-   `requiresQuests`: Array of quest IDs that must be completed first (select these in the quest form under **Quest Requirements**).
    Automated tests ensure these dependencies reference existing quests and avoid cycles.

Quest data is validated against a JSON schema. Titles and descriptions reject `<` and `>`
characters, and `image` must be a data URL, an absolute HTTP(S) link, or a root-relative path.
Quest titles must be unique across all existing quests. Automated tests also expect every dialogue
node to include at least one option so the quest can progress.

### Current Implementation State

> **Note:** The quest editor lets you build branching dialogue directly in the browser. The current
> implementation in `QuestForm.svelte` supports quest metadata (title, description, image), selecting
> required quests, defining an NPC, creating dialogue nodes with `goto`, `finish`, `process`, or
> `grantsItems` options, and adding item requirements for gating. You can choose the start node and
> manage options without writing JSON, and the preview updates live for uploaded images. The form
> remains mobile‑responsive and stacks action buttons on small screens.

The editor focuses on the fundamentals today and exposes controls to gate dialogue options on
specific items, grant items inline, and set completion rewards. You can run
`cd frontend && npm run generate-quest --template basic` (or `branching`) to scaffold a template
JSON file with placeholder dialogue.

-   Item requirements, item grants, and quest rewards
-   Process action selection
-   Preview functionality plus basic quest-flow checks (start node, finish path, unreachable nodes)

### In-game editor flow (create + edit)

Use the in-game quest editor to create and update custom quests that are stored locally in your
browser's IndexedDB custom content database (with an in-memory fallback if IndexedDB is not
available, so changes will not persist after refresh).

**Create a quest**

1. Open `/quests/create`.
2. Fill out the quest metadata (title, description, image, NPC).
3. Add dialogue nodes and options (`goto`, `finish`, `process`, or `grantsItems`) and choose the
   start node.
4. Save the quest to store it locally and receive a link to view it.

**Edit a quest**

1. Open `/quests/manage`.
2. Click **Edit** on a custom quest (built-in quests are read-only); this routes to
   `/quests/[id]/edit`.
3. Update the fields and save to update the local IndexedDB record.

**Validation and image handling**

- Titles must be unique and at least 3 characters; descriptions must be at least 10 characters.
- NPC selection defaults to **Mission Control** if left blank.
- Dialogue node IDs must be unique, nodes require text, and each node needs at least one option.
- Goto options must target existing node IDs; process options require a process ID.
- Required and granted item rows must include an item ID and positive count (the same applies to
  quest reward items).
- Image uploads are downsampled into square JPEG data URLs (target ~50KB). If you leave the image
  blank on a new quest, the editor uses `/assets/quests/howtodoquests.jpg` as the default.
- The simulation summary warns if dialogue paths cannot reach a finish option, but it does not
  block saving.

### Testing Your Quest

Before submitting a quest, verify:

-   All dialogue paths lead to completion
-   Item grants and requirements function correctly
-   Process integrations work as expected
-   Educational content is accurate and clear
-   Safety warnings are included where appropriate

## Contribution Workflow

### Preferred: In-game editor + submission forms

1. Use the in-game editor at `/quests/create` or `/quests/manage` to create or edit your quest.
2. Use the preview and flow checks to confirm dialogue flow and reward logic.
3. Export your custom content from `/contentbackup` (Prepare backup → Download backup).
4. Submit your quest JSON at `/quests/submit` (or submit a bundle at `/bundles/submit`).
5. Track review feedback in the linked GitHub pull request and iterate as needed.

### Manual JSON contribution

1. Develop your quest locally following these guidelines. Start with
   `cd frontend && npm run generate-quest --template basic` for a ready-made template.
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
