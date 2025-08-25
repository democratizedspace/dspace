---
title: 'Cloud Sync'
slug: 'cloud-sync'
---

DSPACE can back up your progress to a private GitHub gist.

## Enable Cloud Sync

1. Create a new secret gist on GitHub.
2. Copy the gist URL or ID.
3. In DSPACE, open the **Settings** page and provide a GitHub token with gist scope.
4. Enter your gist ID to start syncing.

### Token storage

The token and gist ID are stored in `localStorage`. Remove them at any time from the Settings page.

## What gets synced?

-   Game save data
-   Custom quests, items, and processes

Syncs happen in the background whenever changes occur.

## Disable Cloud Sync

Clear the token and gist ID from Settings. Local progress remains on your device.
