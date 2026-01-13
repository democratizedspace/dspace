---
title: 'Backups'
slug: 'backups'
---

DSPACE offers backup options that protect both your overall game state and any custom content you
create. This guide explains what gets saved, where the data lives, and how to restore it on another
device.

## What gets backed up

- **Game saves** – quest progress, inventory, and processes.
- **Custom content** – player-created items, quests, and processes.
- **Cloud Sync (optional)** – automatic encrypted cloud storage for the above data. Cloud Sync is
  covered in more detail at [Cloud Sync](/docs/cloud-sync).

Backups use a stable JSON schema so exports from older releases remain compatible with newer
clients.

## Exporting and importing game saves

1. Open [Import/export gamesaves](/gamesaves).
2. Click **Copy** to place a Base64-encoded JSON snapshot on your clipboard (works even if the
   Clipboard API is unavailable) or download the text manually.
3. To restore, paste a previously saved string and select **Import**. Your quests, inventory, and
   processes will be replaced with the imported data.

The encoded JSON stores `quests`, `inventory`, and `processes` keys. Keep the output somewhere you
control (password manager, notes app, or version-controlled gist).

## Exporting and importing custom content

1. Open [Custom Content Backup](/contentbackup).
2. Click **Prepare backup** to package user-created items, quests, processes, and their required
   images into a portable file.
3. When processing finishes, choose **Download backup** and store the file somewhere safe.
4. To restore, drag and drop the backup file (or browse to it) and wait for the success message.

The backup includes a JSON manifest with `schemaVersion`, timestamps, and the `items`, `processes`,
`quests`, and `images` payloads. Use this path if you want to move custom creations between profiles
without touching your main save.

## Automated backups with Cloud Sync

For hands-off backups, enable Cloud Sync from [Settings](/settings) (see the dedicated
[Cloud Sync](/docs/cloud-sync) doc). Once configured, the client periodically uploads encrypted
snapshots so you do not need to manage strings manually. Local exports remain available as a manual
failsafe.

## Best practices

- **Version regularly:** Export after finishing a quest chain or before testing mods.
- **Store safely:** Treat exports like save files—keep them in a private repo or password manager.
- **Validate imports:** After restoring on a new device, open `/quests` and `/inventory` to confirm
  expected progress and items.
- **Keep both modes:** Even with Cloud Sync enabled, keep occasional manual exports so you have an
  offline backup.

## Troubleshooting

- **Import fails:** Ensure the backup file is complete and comes from the matching export path
  (gamesaves vs. custom content).
- **Old backup, new client:** The schema is backward compatible. If a restore still fails, try a
  newer backup or contact support via the in-app **Help → Contact support** option.
