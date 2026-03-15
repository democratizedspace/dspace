---
title: 'Cloud Sync'
slug: 'cloud-sync'
---

# Cloud Sync

Cloud Sync stores encrypted backups in a private GitHub gist so you can recover across browsers or
devices.

## What Cloud Sync handles

- Game-state backups
- Custom content backups
- Upload/download operations tied to your configured gist

## Setup

1. Create a GitHub personal access token with **gist** scope.
2. Create or choose a private gist.
3. Open `/cloudsync` (or Settings cloud-sync controls).
4. Save token and gist ID.
5. Run an upload, then verify a download from another profile/device.

## Credentials and storage

- Token and gist ID are stored locally in IndexedDB.
- Credentials stay on your device except for authenticated requests to GitHub APIs.
- You can clear credentials from Settings (logout/clear actions).

## Operational guidance

- Keep manual exports from `/gamesaves` and `/contentbackup` as a fallback.
- Rotate tokens if a device is lost or shared.
- Use separate tokens for Cloud Sync and contribution actions if you want tighter least-privilege.

## Troubleshooting

- **401/403:** token scope invalid or token revoked.
- **404 gist:** incorrect gist ID or missing access rights.
- **Sync appears stale:** verify current profile writes before uploading and reload after download.
