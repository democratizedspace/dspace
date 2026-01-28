---
title: 'Custom Quest System'
slug: 'custom-quest-system'
---

# Custom Quest System

DSPACE includes an in-game editor that lets you build, test, and submit quests without hand-editing
JSON files. This page outlines the workflow and links to detailed guides.

## Features

- **QuestForm editor** – Create nodes, options, and upload images through a friendly UI that stores
  pictures locally as data URLs
- **Schema validation** – The editor validates required fields and dialogue structure before saving
- **Preview mode** – See how your quest plays before saving
- **Simulation testing** – Run automated checks to verify quest logic before saving
- **Submission forms** – Paste quest or bundle JSON into `/quests/submit` or `/bundles/submit` to
  open a pull request

## Creating quests

1. Open the quest creator from the in-game quests page (`/quests/create`)
2. Add nodes, options, and optional images in the form
3. Resolve validation errors highlighted by the editor
4. Preview the quest to ensure everything works

For writing tips and narrative conventions, see the
[Quest Development Guidelines](/docs/quest-guidelines).

## Submitting quests

When your quest is ready to share:

1. Export your quest JSON from `/contentbackup` (Prepare backup → Download backup)
2. Paste the quest JSON into `/quests/submit` (or the bundle JSON into `/bundles/submit`)
3. Enter a GitHub token to open a pull request

See the [Quest Submission Guide](/docs/quest-submission) for step-by-step instructions.
