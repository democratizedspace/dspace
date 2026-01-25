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

## In-game Custom Content Workflow (Quests, Items, Processes)

Custom content is created entirely in the browser and saved locally before you export or submit it.
The sections below reflect the **current** editor behavior and routes.

### Quests (`/quests/create` and `/quests/{id}/edit`)

1. **Open the quest editor** at `/quests/create` (or use **Manage Quests → Edit** to reach
   `/quests/{id}/edit` for an existing custom quest).
2. **Fill in metadata**: title, description, NPC avatar, and a quest image. The image uploader
   downsamples to a 512×512 JPEG and stores a data URL for faster IndexedDB storage.
3. **Define dialogue nodes**: add nodes, set the start node, and configure options (`goto`, `finish`,
   run a process, grant items, and require items for gated options).
4. **Set rewards and quest prerequisites** using the built-in selectors.
5. **Save** to persist the quest locally. New custom quests receive a UUID-style ID and are marked
   `custom: true`.

### Items (`/inventory/create` and `/inventory/item/{id}/edit`)

1. **Open the item form** at `/inventory/create` (or edit via **Manage Items → Edit**).
2. **Provide required fields**: name, description, and an image. Images are also downsampled to a
   512×512 JPEG data URL before saving.
3. **Optional fields**: price, unit, type, and dependencies.
4. **Save** to create the item. New items are added to the player inventory with count `0` so they
   can be referenced immediately by quests or processes.

### Processes (`/processes/create` and `/processes/{id}/edit`)

1. **Open the process form** at `/processes/create` (or edit via **Manage Processes → Edit**).
2. **Set the title and duration**. Durations accept inputs like `1h 30m` or `45s` and are normalized
   to a canonical format when saved.
3. **Define item relationships**: Required items (not consumed), Consumed items (removed on start),
   and Created items (awarded on completion). At least one relationship is required and all counts
   must be positive.
4. **Save** to persist the process locally and preview it immediately.

## Data Storage Strategy (Custom Content)

- **Primary storage**: IndexedDB database named `CustomContent` with object stores for `items`,
  `processes`, and `quests`. Each entry is stored with creation timestamps and a `custom: true` flag.
- **Edit behavior**: updates overwrite the existing entry and set `updatedAt` timestamps.
- **Fallback behavior**: if IndexedDB is unavailable, the app falls back to an in-memory store for
  the session so edits still work (but won’t persist after refresh).
- **Export/backup**: use `/contentbackup` or custom content bundle export to generate Base64-encoded
  JSON snapshots that can be imported later or submitted via PR.

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
