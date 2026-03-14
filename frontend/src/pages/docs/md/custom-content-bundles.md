---
title: 'Custom Content Bundles'
slug: 'custom-bundles'
---

# Custom Content Bundles

Bundles keep custom quests, items, and processes synchronized for review and import.

## Bundle format

A bundle is a JSON object with three arrays:

```json
{
    "quests": [],
    "items": [],
    "processes": []
}
```

Each entry should already satisfy the corresponding schema/validation rules.

## Recommended v3 workflow (in-game first)

1. Create content in-game:
    - Quests: [/quests/create](/quests/create)
    - Items: [/inventory/create](/inventory/create)
    - Processes: [/processes/create](/processes/create)
2. Export a custom-content backup from [/contentbackup](/contentbackup).
3. Validate relationships (quest requirements, item/process IDs, references).
4. Submit via [/bundles/submit](/bundles/submit).

## CLI workflow

```bash
node scripts/create-content-bundle.js submissions/bundles/my-bundle.json path/to/quest.json --items path/to/item.json --processes path/to/process.json
```

The script supports glob patterns for bulk inclusion.

## Verification checklist before submitting

- Quest `requiresQuests` targets exist.
- `requiresItems` / `consumesItems` / `createsItems` references resolve.
- Docs are updated for any tree materially changed by the quest content.
- Link and lint checks pass locally.

Useful references:

- [Custom Quest System](/docs/custom-quest-system)
- [Quest Schema](/docs/quest-schema)
- [Process Guidelines](/docs/process-guidelines)
