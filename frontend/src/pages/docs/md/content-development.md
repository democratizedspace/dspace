---
title: 'Content Development Guide'
slug: 'content-development'
---

# DSPACE Content Development (v3)

This is the canonical authoring hub for custom quests, items, and processes.

## Scope and model

DSPACE v3 supports three custom content types:

1. **Quests** — progression/dialogue structures
2. **Items** — inventory entities used by quests/processes
3. **Processes** — timed transformations and production loops

All are first-class: create, edit, export, import, and validate.

## In-game creation + management routes

### Create

- Quests: `/quests/create`
- Items: `/inventory/create`
- Processes: `/processes/create`

### Manage

- Quests: `/quests/manage`
- Items: `/inventory/manage`
- Processes: `/processes/manage`

Built-in content is read-only; custom content is editable/removable.

## Storage behavior

- Custom content is persisted in IndexedDB (`CustomContent`).
- If IndexedDB is unavailable, the app can fall back to non-persistent memory mode.
- Custom records include metadata such as `createdAt`/`updatedAt` and custom flags.

## Validation and quality expectations

Before submitting content changes, run:

```bash
npm run lint
npm run type-check
npm run build
npm run test:ci
node scripts/link-check.mjs
```

For quest-heavy updates, run full quest validation loops used by CI tooling.

## Bundle export/import workflow

Use `/contentbackup` to export/import bundle JSON with this high-level shape:

```json
{
    "quests": [],
    "items": [],
    "processes": []
}
```

Related docs:

- [Custom Content Bundles](/docs/custom-bundles)
- [Quest Submission Guide](/docs/quest-submission)

## Recommended contributor flow

1. Draft content in-game.
2. Validate dependencies, unlock flow, and rewards locally.
3. Export a bundle from `/contentbackup`.
4. Verify clean import on a fresh profile.
5. Submit with docs + tests in one PR.

## Deep-dive references

- [Quest Guidelines](/docs/quest-guidelines)
- [Quest Schema](/docs/quest-schema)
- [Quest Template](/docs/quest-template)
- [Quest Contribution Guide](/docs/quest-contribution)
- [Item Guidelines](/docs/item-guidelines)
- [Process Guidelines](/docs/process-guidelines)
