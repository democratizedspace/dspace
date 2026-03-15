---
title: 'Import / Export Gamesaves'
slug: 'gamesaves'
---

# Import / Export Gamesaves

`/gamesaves` provides local file-based backup and restore for your save.

## What this route is for

- Manual backup snapshots before risky changes
- Moving a save between browsers/devices without cloud sync
- Recovering from accidental data loss

## Best practices

1. Export before large custom content edits or migration testing.
2. Keep timestamped backups (for example, one per major session).
3. After import, verify key state on `/stats`, `/quests`, and `/inventory`.
4. Pair local backups with [Cloud Sync](/docs/cloud-sync) for redundancy.

## Related docs

- [Backups](/docs/backups)
- [Cloud Sync](/docs/cloud-sync)
- [Settings](/docs/settings)
