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

## Exporting and importing game saves

At `/gamesaves`:

- Export creates a Base64-encoded JSON snapshot that preserves quest progress, inventory, and processes.
- Paste a game state backup string (envelope or raw state) here: the import textarea accepts either format.
- Use Copy to copy the exported backup string to your clipboard.
- Use Import to restore a backup into the current profile.

Use this route for full-profile migration between devices.

## Where v3 data lives and QA inspection/reset

- Primary v3 game-state storage is IndexedDB (`dspaceGameState`, `state` store, `root` key).
- `localStorage.gameState` and `localStorage.gameStateBackup` are maintained as mirrors/fallback
  snapshots.
- For QA inspection: open DevTools → Application → IndexedDB / Local Storage and compare values.
- For QA resets: use `/settings` legacy/QA controls to clear v3 IndexedDB state intentionally, then
  re-seed legacy fixtures as needed.

## Exporting and importing custom content

At `/contentbackup`:

- Prepare backup builds a bundle from local custom content.
- The UI shows Preparing backup… while collecting records.
- Download backup writes a `.json` or `.dspace-backup` file depending on selected format.
- Import supports Drag and drop or Choose backup file workflows.
- During restore, the UI shows Importing… and then Import complete on success.

Use this route for creator workflows and submission preparation.

## Cloud Sync pairing

Cloud Sync can automate backup upload/download after you configure a GitHub token + gist ID.
For setup details, see [Cloud Sync](/docs/cloud-sync) and [Authentication](/docs/authentication).

## Safety checklist

- Confirm restore on a second profile/device before deleting original data.
- Keep dated backups during major updates.
- Treat exports as sensitive personal save data.
- Use Settings logout when testing on shared machines.
