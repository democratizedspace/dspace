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

## Where v3 data lives (and QA inspection/reset)

- Canonical runtime save: IndexedDB database `dspaceGameState` (stores `state` and `backup`).
- LocalStorage mirrors: `gameState` and `gameStateBackup` hold v3 snapshots for fallback/recovery.
- Legacy v1/v2 detection for migration also reads those localStorage keys, but only treats them as
  legacy when they parse as pre-v3 payloads.

For QA storage inspection/reset:

1. Open DevTools → **Application**.
2. Inspect **IndexedDB** → `dspaceGameState` for canonical v3 data.
3. Inspect **Local Storage** for `gameState` / `gameStateBackup` mirrors.
4. Use `/settings`:
   - **Legacy save upgrades** for merge/replace/discard legacy flows.
   - **Clear v3 save for testing** (QA cheats) to clear v3 persistence while preserving seeded
     legacy fixtures.

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
