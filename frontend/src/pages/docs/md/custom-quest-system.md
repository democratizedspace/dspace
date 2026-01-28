---
title: 'Custom Quest System'
slug: 'custom-quest-system'
---

# Custom Quest System

DSPACE includes an in-game editor that lets you build and test quests without editing JSON by
hand. When you're ready to submit, export your content as JSON and use the submission forms. This
page outlines the workflow and links to detailed guides.

## Features

- **QuestForm editor** – Create nodes, options, and upload images through a friendly UI that stores
  pictures locally as data URLs
- **Validation** – The editor runs custom quest schema checks plus UI validation for dialogue targets
  and item counts before saving
- **Preview mode** – See how your quest plays before saving
- **Simulation checks** – Flag missing finish paths or unreachable dialogue nodes
- **Contribution workflow** – Submit quests or bundles for review and open a pull request

## Creating quests

1. Open the quest creator from the in-game quests page
2. Add nodes, options, and optional images in the form
3. Resolve validation errors highlighted by the editor
4. Preview the quest to ensure everything works

For writing tips and narrative conventions, see the
[Quest Development Guidelines](/docs/quest-guidelines).

## Submitting quests

When your quest is ready to share:

1. Export your custom content from [/contentbackup](/contentbackup)
2. Paste quest JSON into [/quests/submit](/quests/submit) or submit a bundle at
   [/bundles/submit](/bundles/submit)
3. Authenticate if prompted, then submit to open a pull request

See the [Quest Submission Guide](/docs/quest-submission) for step-by-step instructions.
