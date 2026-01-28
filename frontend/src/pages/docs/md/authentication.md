---
title: 'Authentication Flow'
slug: 'authentication'
---

DSPACE uses GitHub authentication for features that interact with the official repository or
GitHub Gists, such as submitting custom quest pull requests, submitting custom content bundles, or
syncing your save data with **Cloud Sync**.

## Authentication surfaces

You will be asked for a GitHub personal access token in these places:

- **Quest submission form** (creates a pull request in the official DSPACE repo).
- **Custom content bundle submission** (creates a pull request in the official DSPACE repo).
- **Cloud Sync** (list, upload, restore, and download GitHub Gist backups).
- **Quest completion options** that are marked `requiresGitHub` (the finish option is disabled and
  clearly shows that a GitHub connection is required).

You can clear credentials at any time from the **Settings → Log out** panel.

## Personal Access Tokens

To authenticate, generate a GitHub personal access token with the appropriate scopes. The token is
used client-side only and never sent anywhere except directly to GitHub's API.

**Recommended scopes (covers every surface):**

- **`repo`** – required for quest submissions and custom content bundle pull requests.
- **`gist`** – required for Cloud Sync (listing and creating backup gists).

1. Visit
   [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens).
2. Create a token granting **repo** and **gist** permissions.
3. Paste the token into the relevant form in DSPACE and click **Save**.

## Token validation

- Quest submission and custom content bundle submission forms check that the token looks valid
  before creating a pull request.
- Cloud Sync validates the token directly against the GitHub Gists API before saving it.

## Token storage

Your token is stored in the game state and persisted to IndexedDB under
`gameState.github.token` so you don't need to re-enter it each time you open the game. Cloud Sync
also stores an optional gist ID under `gameState.cloudSync.gistId` when you paste one for manual
restores. You can clear the saved token using the **Clear** button next to the input field or by
logging out from **Settings**.

Cloud Sync backups are created as **private gists**. Backup payloads are sanitized to remove
sensitive keys before upload.

## Security considerations

- The token never leaves your browser except when making authenticated requests to GitHub.
- You can revoke the token at any time from your GitHub settings.
- If you share your device, remember to clear the token to prevent unauthorized submissions.
- User-generated markdown is sanitized with DOMPurify before rendering to prevent XSS.

With a valid token saved, quest submissions, custom content bundle submissions, and Cloud Sync will
work seamlessly.

## Logging out

If you're using a shared machine, open the **Settings** page and click **Log out** to clear the
saved GitHub token and Cloud Sync gist ID from the device. This removes access to your synced data
until you sign in again.
