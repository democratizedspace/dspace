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

- Export creates a Base64-encoded JSON snapshot (backup envelope + payload) that preserves quest progress, inventory, and processes.
- Paste a game state backup string (envelope or raw state) here: the import textarea accepts either format.
- Use Copy to copy the exported backup string to your clipboard.
- Use Import to restore a backup into the current profile.

Use this route for full-profile migration between devices.

## Storage locations and QA reset notes

- Canonical v3 save: IndexedDB database `dspaceGameState` (stores: `state`, `backup`, `meta`).
- Local mirrors: localStorage `gameState` and `gameStateBackup` are written as resilience mirrors.
- Legacy v2 detection keys: `gameState` and `gameStateBackup` are both scanned for v1/v2-shaped payloads.
- First-load v2 auto-migration checks `gameState` first and falls back to `gameStateBackup`, so
  backup-only legacy storage still migrates unless QA skip mode is enabled.
- Migration parse/read issues surface in `/settings` → **Legacy save upgrades** as inline warnings,
  and migration read errors are also emitted to the browser console.

For QA resets:

1. Use `/settings` → **Legacy save upgrades** for v1/v2 cleanup controls.
2. If QA cheats are enabled, use **Clear v3 save for testing** to remove v3 state while preserving legacy v2 artifacts.
3. For manual inspection, use browser DevTools → Application → IndexedDB/localStorage.

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
