---
title: 'Content Development Guide'
slug: 'content-development'
---

# DSPACE Content Development Guide

This is the canonical hub for creating v3 custom content.

## v3 custom content model

DSPACE supports three content types that can be authored in-game:

1. **Quests** – branching progression and rewards
2. **Items** – resources/tools used by quests and processes
3. **Processes** – timed transformations between items

All three are first-class in v3 and can be created, edited, exported, and re-imported.

## Where to create and manage content

### Create routes

- Quests: `/quests/create`
- Items: `/inventory/create`
- Processes: `/processes/create`

### Manage routes

- Quests: `/quests/manage`
- Items: `/inventory/manage`
- Processes: `/processes/manage`

Built-in content is read-only; custom content is editable and removable.

## Storage and persistence (v3)

- Custom content is stored in the `CustomContent` IndexedDB database.
- If IndexedDB is unavailable, the app falls back to in-memory storage (non-persistent).
- New records are tagged as custom and carry timestamps; edits update `updatedAt`.

## Editor-specific behavior

### Quest editor

- Requires title + description + valid dialogue node graph.
- Dialogue options support goto, finish, process links, and item grants/requirements.
- New quests default to a built-in quest image when no image is supplied.
- Validation prevents broken node links and malformed item/process references.

### Item editor

- Requires name, description, and image.
- Supports optional pricing, unit, type, and dependencies.
- New custom items default to the `Custom` category if not specified.

### Process editor

- Requires title, duration, and at least one item relationship.
- Duration parser supports shorthand (`45s`, `1h 30m`, `0.5h`) and normalizes values.
- Positive item counts are enforced for requires/consumes/creates lists.

## Export, backup, and submission

- Use `/contentbackup` to export/import combined custom content bundles.
- Bundle format docs: [Custom Content Bundles](/docs/custom-bundles).
- Submission workflow docs: [Quest Submission Guide](/docs/quest-submission).

## Contributor workflow (recommended)

1. Draft content in-game and validate it locally.
2. Run gameplay checks: progression logic, item/process dependencies, reward balance.
3. Export a bundle and verify import on a clean profile.
4. Prepare submission artifacts (docs, screenshots, tests as needed).
5. Open a PR with clear scope and verification notes.

## Deep-dive docs

- [Quest Guidelines](/docs/quest-guidelines)
- [Quest Schema](/docs/quest-schema)
- [Quest Template](/docs/quest-template)
- [Quest Contribution Guide](/docs/quest-contribution)
- [Item Guidelines](/docs/item-guidelines)
- [Process Guidelines](/docs/process-guidelines)

## QA and correctness expectations

Before submitting content changes, run repo checks from the project root:

```bash
npm run lint
npm run type-check
npm run build
npm run test:ci
```

For quest-heavy updates, also run link + quest validation checks noted in the AGENTS guide.
