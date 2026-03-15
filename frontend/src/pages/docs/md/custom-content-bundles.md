---
title: 'Custom Content Bundles'
slug: 'custom-content-bundles'
---

# Custom Content Bundles

Bundles package related custom quests, items, and processes so dependency chains stay intact during
backup, transfer, and review.

## Bundle shape

```json
{
    "quests": [],
    "items": [],
    "processes": []
}
```

Each entry must satisfy its corresponding schema validation rules.

## In-game workflow (recommended)

1. Create/edit content at `/quests/create`, `/inventory/create`, `/processes/create`.
2. Export from `/contentbackup`.
3. Validate by importing the bundle into a clean profile.
4. Submit at `/bundles/submit`.

## CLI workflow (repo contributors)

```bash
node scripts/create-content-bundle.js submissions/bundles/my-bundle.json path/to/quest.json --items path/to/item.json --processes path/to/process.json
```

Use globs to include multiple files and commit the resulting bundle with your PR.

## Validation checklist

- All referenced item/process IDs exist inside the bundle or in built-in content.
- Quest prerequisites resolve correctly.
- No malformed IDs or broken dialogue node links.
- Bundle re-import succeeds before submission.

Related docs: [Content Development](/docs/content-development),
[Quest Submission Guide](/docs/quest-submission), [Quest Schema](/docs/quest-schema).
