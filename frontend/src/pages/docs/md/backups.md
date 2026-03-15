---
title: 'Backups'
slug: 'backups'
---

# Backups and Restore (v3)

DSPACE has separate backup paths for gameplay state and custom content. Use both.

## Backup surfaces

### 1) Game-state backup (`/gamesaves`)

Backs up core progression data such as:

- quests
- inventory
- processes

Import is replace-style for the game-state payload.

### 2) Custom content backup (`/contentbackup`)

Backs up player-authored content:

- custom quests
- custom items
- custom processes

Use this when moving custom authoring work across profiles/devices.

### 3) Optional cloud backup (`/cloudsync`)

Cloud Sync stores encrypted backups using a private GitHub gist you control.

## Recommended backup routine

1. Export from `/gamesaves` before major progression changes.
2. Export from `/contentbackup` before editing large quest/process/item sets.
3. If enabled, verify `/cloudsync` last sync status after major sessions.
4. Keep at least one offline/manual copy.

## Restore guidance

- Restore game-state and custom content separately using their matching pages.
- After restoring, sanity check `/quests`, `/inventory`, and `/processes`.
- For migration testing (v1/v2 to v3), prefer Settings migration controls and QA seeding paths.

## Security and privacy notes

- Backups may include meaningful progression and authored content.
- Store exported files/strings in private locations (password manager/private storage).
- Clear cloud tokens from Settings when using shared devices.

## Related docs

- [Cloud Sync](/docs/cloud-sync)
- [Legacy save storage](/docs/legacy-save-storage)
- [State migration](/docs/state-migration)
