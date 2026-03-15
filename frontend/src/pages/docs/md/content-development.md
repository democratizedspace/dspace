---
title: 'Content Development Guide'
slug: 'content-development'
---

# Content Development Guide (v3)

This is the canonical hub for creating and validating custom content in v3.

## Content model

DSPACE supports three in-game editable content types:

1. **Quests** (branching progression, dialogue, requirements, rewards)
2. **Items** (resources/tools/currencies)
3. **Processes** (timed item transformations)

All three can be created, edited, exported, imported, and submitted.

## Authoring routes

### Create

- Quests: `/quests/create`
- Items: `/inventory/create`
- Processes: `/processes/create`

### Manage

- Quests: `/quests/manage`
- Items: `/inventory/manage`
- Processes: `/processes/manage`

Built-in content remains read-only. Custom content is editable and removable.

## Storage and persistence

- Custom content is stored in IndexedDB (`CustomContent` database).
- If IndexedDB is unavailable, the app falls back to in-memory storage (non-persistent).
- Records are marked custom and include created/updated timestamps.

## Validation expectations by content type

### Quests

- Valid title/description/dialogue graph is required.
- Dialogue options support goto/finish, item requirements/grants, and process links.
- Validation catches broken node references and invalid dependencies.

### Items

- Name, description, and image are required.
- Optional fields include unit, category/type, pricing, and dependencies.

### Processes

- Title, duration, and at least one item relationship are required.
- Duration parser supports shorthand (`45s`, `1h 30m`, `0.5h`).
- Requires/consumes/creates item counts must be positive.

## Export and submission workflow

1. Build and validate content in local profile.
2. Export from `/contentbackup`.
3. Re-import the export on a clean profile to verify integrity.
4. Submit via `/bundles/submit`.
5. Include matching docs updates in your PR.

Reference docs:

- [Custom Content Bundles](/docs/custom-content-bundles)
- [Quest Submission Guide](/docs/quest-submission)
- [Quest Schema](/docs/quest-schema)
- [Item Guidelines](/docs/item-guidelines)
- [Process Guidelines](/docs/process-guidelines)

## Pre-PR checks

Run from the repository root:

```bash
npm run lint
npm run type-check
npm run build
npm run test:ci
node scripts/link-check.mjs
```
