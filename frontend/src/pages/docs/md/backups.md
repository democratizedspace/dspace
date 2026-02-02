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
2. In the export panel, select **Copy** to copy the Base64-encoded JSON backup envelope shown on
   screen. The button briefly changes to **Copied!** or **Copy failed** to confirm the action.
3. In the import panel labeled “Paste a game state backup string (envelope or raw state) here,”
   paste your saved string and select **Import**. If something goes wrong, the page shows “Import
   failed. Please double-check the backup string and try again.” Your quests, inventory, and
   processes are replaced with the imported data.

The encoded JSON stores `quests`, `inventory`, and `processes` keys. Keep the output somewhere you
control (password manager, notes app, or version-controlled gist).

## Exporting and importing custom content

1. Open [Custom Content Backup](/contentbackup).
2. In the **Export custom content** panel, click **Prepare backup**. While it runs you will see a
   “Preparing backup…” status and a progress list. When it finishes, a **Prepared content** summary
   appears along with the **Download backup** button.
3. Click **Download backup** to save the JSON file to your device.
4. In the **Import custom content** panel, drop the file onto the “Drag and drop your backup file
   here, or click to browse.” area or click **Choose backup file** to select it. The status
   updates to “Importing…” and then “Import complete,” including the filename.

The backup file stores `schemaVersion`, `timestamp`, and the `items`, `processes`, `quests`, and
`images` arrays. Use this path if you want to move custom creations between profiles without
touching your main save.

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

- **Import fails:** Ensure the string is complete (no trimmed whitespace) and comes from the matching
  export path (gamesaves vs. custom content).
- **Old backup, new client:** The schema is backward compatible. If a restore still fails, try a
  newer backup or contact support via the in-app **Help → Contact support** option.
- **Clipboard blocked:** Manually select and copy the text area contents; the export remains valid.
