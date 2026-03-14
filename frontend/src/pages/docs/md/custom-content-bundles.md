---
title: 'Custom Content Bundles'
slug: 'custom-bundles'
---

# Custom Content Bundles

Bundles are the recommended v3 submission unit when a quest depends on new items or processes.
Instead of opening separate PR payloads, package everything into one JSON object so reviewers can
validate your content as a connected system.

## Bundle format

```json
{
    "quests": [],
    "items": [],
    "processes": []
}
```

Each array should contain schema-valid objects for that content type.

## v3 workflow

1. Create/edit content in-game:
    - Quests: [/quests/create](/quests/create)
    - Items: [/inventory/create](/inventory/create)
    - Processes: [/processes/create](/processes/create)
2. Verify and refine entries from management pages:
    - `/quests/manage`, `/inventory/manage`, `/processes/manage`
3. Export your local custom content from [/contentbackup](/contentbackup).
4. Submit the bundle through [/bundles/submit](/bundles/submit).
5. Open the generated PR and include QA notes/screenshots.

## Validation checklist before submitting

- Quest IDs are unique and dependencies resolve.
- Item IDs referenced by quests/processes exist in the bundle or base game.
- Process IDs referenced by quests exist and are runnable.
- Rewards, grants, and process outputs are documented consistently.
- Docs updates are included when behavior is user-facing.

## CLI option

You can still assemble bundles with script tooling:

```bash
node scripts/create-content-bundle.js submissions/bundles/my-bundle.json path/to/quest.json \
  --items path/to/item.json --processes path/to/process.json
```

Use this when preparing larger submissions or when automating a content pipeline.
