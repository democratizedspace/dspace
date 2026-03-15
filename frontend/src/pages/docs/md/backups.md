---
title: 'Backups'
slug: 'backups'
---

# Backups

v3 separates backup concerns into two routes so you can protect both gameplay state and custom
content safely.

## Backup surfaces

- **`/gamesaves`**: full game-state snapshot (quests, inventory, processes, wallet progress)
- **`/contentbackup`**: custom content snapshot (custom quests, items, processes)
- **`/cloudsync`**: optional GitHub gist automation layer for syncing backups

## Recommended backup cadence

1. Export from `/gamesaves` before large quest/progression sessions.
2. Export from `/contentbackup` after custom content editing sessions.
3. Keep at least one offline local copy and one cloud copy.

## Gamesave export/import

At `/gamesaves`:

- **Export** produces a portable encoded payload.
- **Import** restores from either envelope or raw game-state payload.

Use this route for full-profile migration between devices.

## Custom content export/import

At `/contentbackup`:

- **Prepare backup** builds a bundle from local custom content.
- **Download backup** writes a `.json` bundle file.
- **Import** accepts supported bundle files and merges content into local custom storage.

Use this route for creator workflows and submission preparation.

## Cloud Sync pairing

Cloud Sync can automate backup upload/download after you configure a GitHub token + gist ID.
For setup details, see [Cloud Sync](/docs/cloud-sync) and [Authentication](/docs/authentication).

## Safety checklist

- Confirm restore on a second profile/device before deleting original data.
- Keep dated backups during major updates.
- Treat exports as sensitive personal save data.
- Use Settings logout when testing on shared machines.
