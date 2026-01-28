---
title: 'Custom Quest System'
slug: 'custom-quest-system'
---

# Custom Quest System

DSPACE includes an in-game editor that lets you build, test, and submit quests without touching
JSON files. This page outlines the workflow and links to detailed guides.

## Features

- **QuestForm editor** – Create nodes, options, and upload images through a friendly UI that stores
  pictures locally as data URLs
- **Schema validation** – Every quest is checked against the official JSON schema
- **Preview mode** – See how your quest plays before saving
- **Quest flow checks** – Flags missing start nodes, unreachable nodes, and finish paths
- **Submission forms** – Use `/quests/submit` or `/bundles/submit` to open a pull request

## Creating quests

1. Open the quest creator from the in-game quests page
2. Add nodes, options, and optional images in the form
3. Resolve validation errors highlighted by the editor
4. Preview the quest to ensure everything works
5. Save the quest locally (custom quests live in IndexedDB)

For writing tips and narrative conventions, see the
[Quest Development Guidelines](/docs/quest-guidelines).

## Submitting quests

When your quest is ready to share:

1. Export your custom content from `/contentbackup` (Prepare backup → Download backup)
2. For quest-only submissions, paste the quest JSON into `/quests/submit`
3. For bundles with custom items/processes, submit the bundle JSON at `/bundles/submit`
4. Authenticate when prompted to open a pull request

See the [Quest Submission Guide](/docs/quest-submission) for step-by-step instructions.
