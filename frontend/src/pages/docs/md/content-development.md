---
title: 'Content Development Guide'
slug: 'content-development'
---

# DSPACE Content Development Guide

DSPACE is designed to be an extensible platform where community members can create and contribute
various types of content. This guide serves as the central hub for all content development
documentation, providing links to detailed guidelines for each content type.

## Overview

The DSPACE ecosystem supports several types of custom content:

1. **Quests**: Interactive missions that guide players through educational activities
2. **Items**: Virtual resources, tools, and components used throughout the game
3. **Processes**: Activities that transform, create, or utilize items

Each content type follows specific guidelines to ensure consistency, educational value, and
alignment with DSPACE's mission of democratizing space exploration through practical, hands-on
learning.

Management pages (`/quests/manage`, `/inventory/manage`, and `/processes/manage`) let you
edit or delete custom entries stored locally in IndexedDB.

### In-game custom content editors (current behavior)

Use the in-game editors to create and update custom quests, items, and processes. These editors
write to your browser's IndexedDB-backed custom content database (with an in-memory fallback if
IndexedDB is unavailable, which means the data will not persist after refresh).

**Create new content**

1. Open the editor:
    - Quests: `/quests/create`
    - Items: `/inventory/create`
    - Processes: `/processes/create`
2. Fill out the required fields. Each form validates required fields before saving.
3. Save the entry to store it locally. The editor shows a success message with a link to view the
   new item, process, or quest.

**Edit existing content**

1. Open the management page:
    - Quests: `/quests/manage`
    - Items: `/inventory/manage`
    - Processes: `/processes/manage`
2. Click **Edit** on the custom entry (built-in content is read-only).
3. The edit routes resolve to `/quests/[id]/edit`, `/inventory/item/[itemId]/edit`, and
   `/processes/[processId]/edit`.
4. Update the fields and save. The entry is updated in the same IndexedDB store.

**Quest editor specifics**

- Title (min 3 chars) and description (min 10 chars) are required, and titles must be unique across
  existing quests.
- Dialogue nodes need unique IDs, non-empty text, and at least one option. Options can be **goto**,
  **finish**, **process**, or **grantsItems**.
    - Goto options must point to an existing node ID.
    - Process options require a process ID.
    - Required or granted item rows need an item ID and a positive count.
- The NPC picker is populated from the built-in catalog; when editing an existing quest with a
  custom NPC value, the select includes a “Custom (…)” entry for it.
- Quest images are stored as data URLs and are downsampled to square JPEGs (target ~50KB) before
  saving.

**Item editor specifics**

- Items require a name, description, and image (stored as a compressed JPEG data URL).
- Optional fields include price, unit, type, and dependencies (comma- or newline-separated IDs).
- Saving a new item adds it to your local inventory catalog with a custom category label.

**Process editor specifics**

- Processes require a title, duration, and at least one item relationship
  (requires/consumes/creates).
- Durations are normalized to a canonical format after saving (for example, `1h 30m`).
- Item counts must be positive, and empty rows are ignored on save.

**Storage details**

Custom content persists to the `CustomContent` IndexedDB database. The schema includes:

- Object stores: `meta`, `items`, `processes`, and `quests`
- `meta` stores the `schemaVersion` key

When custom content is saved through the editors:

- IDs are generated with `crypto.randomUUID()` (or a UUID fallback) when missing.
- `custom: true` and `createdAt` are set on new records; `updatedAt` is set on edits.
- Items default `category` to `Custom` when not provided.
- Processes default `duration` to `60` seconds if missing (the form provides a normalized duration).

If IndexedDB is unavailable, custom content falls back to an in-memory store (not localStorage),
which is cleared on refresh.

**Export + backup**

Custom quests, items, and processes can be exported via the custom content backup page at
`/contentbackup`, which prepares a JSON bundle for download (used for submissions and backups).

## Getting Started

Before creating any content, we recommend:

1. **Play the game**: Familiarize yourself with existing content and game mechanics
2. **Join the community**: Discuss your ideas on [Discord](https://discord.gg/A3UAfYvnxM)
3. **Review guidelines**: Read the specific guidelines for your content type
4. **Start small**: Begin with a simple creation before tackling more complex projects

## Content Guidelines

### [Quest Development Guidelines](/docs/quest-guidelines)

Comprehensive instructions for creating engaging, educational quests that guide players through
practical space-related activities. Topics include:

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

Detailed guide for creating virtual items that represent resources, tools, and components. Topics
include:

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
