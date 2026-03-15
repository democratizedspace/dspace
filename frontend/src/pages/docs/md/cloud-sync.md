---
title: 'Cloud Sync'
slug: 'cloud-sync'
---

# Cloud Sync (GitHub Gist)

Cloud Sync is an optional v3 feature that uploads encrypted backup snapshots to a private GitHub
Gist you control.

## What you need

1. A GitHub personal access token with `gist` scope.
2. A private gist ID (or URL).

## Setup flow

1. Open `/cloudsync` (or use Settings shortcuts).
2. Enter token and gist ID.
3. Save credentials.
4. Run upload/download to verify connectivity.

## What gets synced

- game save data
- custom content records (quests/items/processes)

## Where credentials are stored

- Token and gist metadata are stored locally in IndexedDB.
- You can clear credentials from Settings/Cloud Sync controls.

## Operational tips

- Keep one manual offline backup even when Cloud Sync is active.
- If sync appears stale, run manual upload then download verification.
- Rotate your GitHub token periodically.

## Troubleshooting

- **401/403 from GitHub:** token missing `gist` scope or expired.
- **404 gist not found:** wrong gist ID or inaccessible gist.
- **No sync effect:** verify token + gist saved before running upload/download.

## Related docs

- [Backups](/docs/backups)
- [Authentication](/docs/authentication)
