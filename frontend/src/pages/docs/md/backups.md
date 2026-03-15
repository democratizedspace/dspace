---
title: 'Backups'
slug: 'backups'
---

# Backups in v3

DSPACE has three backup paths, each with a different scope:

1. **Gamesaves** (`/gamesaves`) – full game-state snapshots
2. **Custom Content Backup** (`/contentbackup`) – quest/item/process bundles only
3. **Cloud Sync** (`/cloudsync`) – optional automated encrypted snapshots to private GitHub gists

Use all three strategically: local exports for safety + Cloud Sync for convenience.

## What each backup includes

| Route | Includes | Does not include |
| --- | --- | --- |
| `/gamesaves` | quest progress, inventory state, process state | custom content library metadata outside save envelope |
| `/contentbackup` | custom quests, items, processes | full player progression |
| `/cloudsync` | encrypted game-state backups and recovery flows | public sharing; this is private gist storage |

## Recommended workflow

1. Before major quest/content edits: export from `/gamesaves`.
2. Before custom content experiments: export from `/contentbackup`.
3. If you play across devices: configure `/cloudsync`.
4. After restore/import: verify `/quests`, `/inventory`, and `/processes` quickly.

## Restore caveats

- Restoring a gamesave replaces active progression state.
- Importing a content backup updates custom content collections.
- Keep timestamped local copies so you can roll back safely.

## Security and storage notes

- Backup artifacts may contain meaningful progression and content data; store them privately.
- Cloud Sync tokens are local browser credentials and should be treated like passwords.
- Clear credentials from Settings when using shared machines.

## Related docs

- [Gamesaves](/docs/gamesaves)
- [Cloud Sync](/docs/cloud-sync)
- [Settings](/docs/settings)
- [Custom Content Bundles](/docs/custom-bundles)
