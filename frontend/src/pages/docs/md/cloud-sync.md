---
title: 'Cloud Sync'
slug: 'cloud-sync'
---

DSPACE can back up your progress to a private GitHub gist.

1. Generate a GitHub personal access token with the `gist` scope (see [GitHub's token guide](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)).
2. Enter the token in the form and click **Save**.
3. Click **Upload** to create/update the gist and store your save data.
4. Copy the resulting Gist ID to use on other devices.
5. On another device, enter the same token and Gist ID and click **Download**.

## Enable Cloud Sync

1. Create a new secret gist on GitHub.
2. Copy the gist URL or ID.
3. In DSPACE, open the **Settings** page and provide a GitHub token with gist scope.
4. Enter your gist ID to start syncing.

### Token storage

The token and gist ID are stored in IndexedDB and load after the game initialises.
Remove them at any time from the Settings page.

## What gets synced?

-   Game save data
-   Custom quests, items, and processes

Syncs happen in the background whenever changes occur.

## Disable Cloud Sync

Clear the token and gist ID from Settings. Local progress remains on your device.
