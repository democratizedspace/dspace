---
title: 'Cloud Sync'
slug: 'cloud-sync'
---

# Cloud Sync

Cloud Sync backs up DSPACE saves to private GitHub gists using credentials stored locally in your
browser.

## Setup checklist

1. Open `/cloudsync`.
2. Create a GitHub personal access token (PAT).
   - Classic PAT with `gist` scope, or
   - Fine-grained PAT with read/write gist permissions
3. Connect token in the Cloud Sync UI.
4. Optionally provide a known Gist ID for manual restore targeting.
5. Upload and verify the backup appears in the list.

## What Cloud Sync does

- Stores encrypted save snapshots in private gists.
- Lists backups created through DSPACE sync flows.
- Supports restore from listed backups or manual gist-id targeting.

## Important safety notes

- Tokens are sensitive credentials; never share screenshots containing them.
- Credentials are stored client-side and can be cleared from Settings.
- Keep at least one local `/gamesaves` export as an offline fallback.

## Troubleshooting

- **No backups listed:** verify token permissions and gist visibility.
- **Restore fails:** confirm gist ID is correct and backup payload is intact.
- **Token revoked/expired:** generate a new token and reconnect.

## Related docs

- [Backups](/docs/backups)
- [Gamesaves](/docs/gamesaves)
- [Authentication](/docs/authentication)
- [Settings](/docs/settings)
