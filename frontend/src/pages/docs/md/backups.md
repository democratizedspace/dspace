---
title: 'Backups'
---

DSPACE offers manual backup options for both your overall game state and any
custom content you create.

## Game saves

Visit the [Import/export gamesaves](/gamesaves) page to copy a snapshot of your
entire progress. Click **Copy** to place the backup string on your clipboard
(works without the Clipboard API) or paste a previously saved string and click
**Import** to restore it on another device.

Game save exports are Base64‑encoded JSON containing `quests`, `inventory` and
`processes` keys. The schema and key names are stable across releases so older
backups remain compatible.

## Custom content

If you only need to back up user‑created items, quests or processes, open the
[Custom Content Backup](/contentbackup) page. It provides the same copy and
import controls but limited to custom creations.

Custom content exports use the same Base64‑encoded JSON format with stable
`items`, `processes` and `quests` keys, ensuring cross‑version compatibility.

These backups are stored locally until you manually save them elsewhere. For
automatic cloud backups see [Cloud Sync](/docs/cloud-sync).
