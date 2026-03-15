---
title: 'Cloud Sync'
slug: 'cloud-sync'
---

# Cloud Sync

`/cloudsync` lets you back up and restore DSPACE state through a private GitHub gist.

## Setup

1. Create a GitHub token with `gist` scope.
2. Open `/cloudsync` and save the token.
3. Upload to create/update your backup gist.
4. Reuse the same token + gist ID on another device, then download.

## What is synced

- Core game save state
- Custom quests, items, and processes

## Token and credential storage

Cloud sync credentials are stored locally in v3 storage and can be cleared from settings controls
when needed.

## Recovery workflow (recommended)

1. Keep periodic local exports from `/gamesaves`.
2. Keep cloud snapshots in `/cloudsync`.
3. Validate recovered state on `/stats` after restore.

## Related docs

- [Import / Export Gamesaves](/docs/gamesaves)
- [Backups](/docs/backups)
- [Settings](/docs/settings)
