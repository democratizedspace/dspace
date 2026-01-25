---
title: 'Content Development Guide'
slug: 'content-development'
---

# DSPACE Content Development Guide

DSPACE is designed to be an extensible platform where community members can create and contribute various types of content. This guide serves as the central hub for all content development documentation, providing links to detailed guidelines for each content type.

## Overview

The DSPACE ecosystem supports several types of custom content:

1. **Quests**: Interactive missions that guide players through educational activities
2. **Items**: Virtual resources, tools, and components used throughout the game
3. **Processes**: Activities that transform, create, or utilize items

Each content type follows specific guidelines to ensure consistency, educational value, and alignment with DSPACE's mission of democratizing space exploration through practical, hands-on learning.

Management pages (`/quests/manage`, `/inventory/manage`, and `/processes/manage`) let you
edit or delete custom entries stored locally in IndexedDB.

## In-game custom content workflow (create + edit)

DSPACE includes three in-game editors that save custom content locally. These editors are the
canonical way to create or update quests, items, and processes without touching JSON files.

### Custom items (/inventory/create → /inventory/item/[itemId]/edit)

1. Open [/inventory/create](/inventory/create) and fill in the required fields (**Name**,
   **Description**, **Image**).
2. Optional fields (**Price**, **Unit**, **Type**, **Dependencies**) can be added as needed.
   Dependency IDs can be separated by commas or new lines.
3. When you upload an image, the client downsamples it to a 512×512 JPEG and targets
   < 50 KB for consistent storage and backup sizes.
4. Click **Create Item** to save. The item is written to IndexedDB and immediately available in
   item pickers (including process and quest editors). A newly created item also receives a
   default inventory count of 0 so it shows up in the inventory list.
5. To edit an item, open [/inventory/manage](/inventory/manage) and select **Edit** to visit
   `/inventory/item/[itemId]/edit`. The same form is reused for updates.

### Custom processes (/processes/create → /processes/[processId]/edit)

1. Open [/processes/create](/processes/create) and enter a **Title** plus a **Duration**
   (e.g., `1h 30m`, `45s`). The form normalizes durations to the canonical format on save.
2. Add at least one relationship across **Required**, **Consumed**, or **Created** items.
   Item counts must be positive numbers.
3. Use **Preview** to validate the process before saving.
4. Click **Create Process** to persist it. The process is stored in IndexedDB and appears in
   process selectors inside quest dialogue options.
5. For edits, open [/processes/manage](/processes/manage) and choose **Edit** to reach
   `/processes/[processId]/edit`. The edit form mirrors the create workflow.

### Custom quests (/quests/create → /quests/[questId]/edit)

1. Open [/quests/create](/quests/create) and provide a **Title**, **Description**, **Image**,
   and **NPC**. The editor downscales images in the same way as items.
2. Choose **Quest Requirements** from the existing quest list. The picker includes built-in
   quests plus any custom quests stored locally.
3. Build dialogue nodes in the visual editor. Every node needs a unique ID, dialogue text,
   and at least one option. Option types include **Go to node**, **Finish quest**,
   **Run process**, and **Grant items**.
4. Option gates can require items, and option rewards can grant items. Item and process
   selectors include both built-in and custom content.
5. Click **Preview** to validate dialogue flow before saving.
6. Save the quest. The editor writes the quest to IndexedDB so it appears immediately in
   the quest list. To edit later, visit [/quests/manage](/quests/manage) and choose **Edit**
   to open `/quests/[questId]/edit`.

## Custom content storage strategy

Custom items, processes, and quests are stored in the browser's IndexedDB database named
`CustomContent` using separate object stores (`items`, `processes`, `quests`). Each record is
tagged with `custom: true` and gets `createdAt`/`updatedAt` timestamps when saved. If IndexedDB is
unavailable (for example, in restricted/private browsing), the game falls back to an in-memory
store for the current session, so data will not persist after a refresh.

## Getting Started

Before creating any content, we recommend:

1. **Play the game**: Familiarize yourself with existing content and game mechanics
2. **Join the community**: Discuss your ideas on [Discord](https://discord.gg/A3UAfYvnxM)
3. **Review guidelines**: Read the specific guidelines for your content type
4. **Start small**: Begin with a simple creation before tackling more complex projects

## Content Guidelines

### [Quest Development Guidelines](/docs/quest-guidelines)

Comprehensive instructions for creating engaging, educational quests that guide players through practical space-related activities. Topics include:

- Quest philosophy and educational goals
- Quest categories and progression paths
- Dialogue structure and NPC interactions
- Technical requirements and JSON structure
- Submission and review process
- Example JSON in the [Quest Template](/docs/quest-template)
- Field definitions in the [Quest Schema Requirements](/docs/quest-schema)
- Step-by-step [Quest Submission Guide](/docs/quest-submission)
- Full workflow in the [Quest Contribution Guidelines](/docs/quest-contribution)

### [Item Development Guidelines](/docs/item-guidelines)

Detailed guide for creating virtual items that represent resources, tools, and components. Topics include:

- Item categories and classification
- Properties and attributes
- Relationship to processes and quests
- Best practices for naming and descriptions
- Technical implementation details

### [Process Development Guidelines](/docs/process-guidelines)

Instructions for creating processes that transform or utilize items. Topics include:

- Process structure and duration formatting
- Item requirements, consumption, and production
- Balancing time and rewards
- Process states and lifecycle
- Creating process chains for progression

### [Custom Content Bundles](/docs/custom-bundles)

Bundle related quests, items, and processes into a single JSON file to keep submissions in sync.

## AI Assistance for Content Creation

For contributors who want to leverage artificial intelligence in their content creation process, we provide [Quest Prompts](https://github.com/democratizedspace/dspace/blob/v3/docs/prompts/codex/quests.md), [Item Prompts](https://github.com/democratizedspace/dspace/blob/v3/docs/prompts/codex/items.md) and [Process Prompts](https://github.com/democratizedspace/dspace/blob/v3/docs/prompts/codex/processes.md) that can be used with modern AI assistants. For automating backlog tasks, see the [Codex Implementation Prompt](https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/baseline.md#implementation-prompt); it walks Codex through selecting an unchecked item from the latest changelog and implementing it from start to finish. For general repository maintenance, the [Codex Upgrade Prompt](https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/baseline.md#upgrade-prompt) instructs Codex to scan the project for improvements and implement them automatically.

These guides include:

- Effective prompt templates for different content types
- Best practices for working with AI assistants
- Scientific accuracy verification techniques
- Dialogue refinement strategies
- Full examples of AI-assisted content creation. Our Playwright test `constellations-quest.spec.ts` walks through creating the `constellations` quest end to end.

These prompt engineering templates were initially created to help develop the first batches of quests for DSPACE and can be valuable tools for brainstorming ideas, refining dialogue, and ensuring scientific accuracy in your own content.

## Development Workflow

The general workflow for content development in DSPACE is:

1. **Ideation**: Develop your concept based on educational principles
2. **Local Development**: Create your content following the appropriate guidelines
3. **Testing**: Verify functionality in your local environment
4. **Submission**: Submit your content for review via pull request
5. **Revision**: Address feedback from reviewers
6. **Integration**: Once approved, your content becomes part of the game

## Testing Your Content

Before submitting:

- **Technical validation**: Ensure your content follows all required formats
- **Educational value**: Verify that your content teaches meaningful concepts
- **Progression fit**: Check that your content fits logically in existing progression paths
- **Consistency**: Maintain consistency with existing game content
- **Balance**: Ensure appropriate difficulty and reward balance

## Contributing to Core Game Systems

For more advanced contributors interested in extending core game functionality:

- Follow the [Developer Guide](../../../../../DEVELOPER_GUIDE.md)
- Start with small enhancements before proposing major changes

## Community Resources

- [Discord Community](https://discord.gg/A3UAfYvnxM): Discuss ideas and get feedback
- [GitHub Repository](https://github.com/democratizedspace/dspace): View source code and submit changes
- [Documentation](/docs): Browse all game documentation
- [Contribution Guide](../../../../../CONTRIBUTING.md): General contribution guidelines

By following these guidelines, you'll create high-quality content that enhances the DSPACE experience while contributing to our mission of democratizing space exploration through practical, hands-on education.
Before submitting, run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci` to keep the codebase healthy.
