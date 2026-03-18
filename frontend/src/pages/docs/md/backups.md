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

## Where v3 save data lives

- Primary save: IndexedDB database `dspaceGameState` (`state`, `backup`, `meta` stores).
- Compatibility mirrors: localStorage keys `gameState`, `gameStateBackup`, and `gameStateLite`.
- Legacy detection: v2 migration logic checks `gameState` and `gameStateBackup` for v1/v2-shaped
  payloads.

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

### QA inspection / reset steps

1. Open browser DevTools → **Application**.
2. Inspect IndexedDB → `dspaceGameState` (`state`/`backup` stores, key `root`).
3. Inspect Local Storage keys (`gameState`, `gameStateBackup`, `gameStateLite`).
4. For a full QA reset, clear cookies, localStorage, and IndexedDB for the site origin.
5. For legacy-only cleanup, use `/settings` → **Legacy save upgrades** → **Delete v2 localStorage
   data**.

### Merge vs replace semantics for v2 legacy imports

- **Merge v2 into current save**: inventory counts are additive, existing quests/processes are kept,
  and missing quest/process entries from legacy are added.
- **Replace current save with v2**: v3 state is replaced by migrated legacy v2 state.
- Both actions clear legacy `gameState` / `gameStateBackup` keys when IndexedDB is active.

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
