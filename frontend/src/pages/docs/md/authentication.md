---
title: 'Authentication Flow'
slug: 'authentication'
---

DSPACE uses GitHub authentication for features that interact with the official repository, such as
submitting custom quest pull requests or syncing your save data with **Cloud Sync**.

## Authentication surfaces

These are the places in DSPACE that request a GitHub token today:

- **Cloud Sync** (`/cloudsync`) stores and validates a token, then uses it to list backups, upload
  encrypted saves to a private gist, and restore from a gist ID. The Cloud Sync UI also lets you
  clear the stored gist ID after restores.
- **Quest submission** (`/quests/submit`) uses your token to open a pull request for a quest JSON
  submission.
- **Custom content bundle submission** (`/bundles/submit`) uses the token to open a pull request for
  bundled quests, items, and processes.
- **Quest dialogue gates**: quests can mark options with `requiresGitHub`, which disables those
  choices until a token is saved (for example, the “Connect GitHub” onboarding quest).

Use the **Settings → Log out** panel to clear saved tokens and Cloud Sync IDs on shared devices.

## Personal Access Tokens

To authenticate, generate a GitHub personal access token with the `repo` and `gist` scopes. The
token is used client-side only and never sent anywhere except directly to GitHub's API.

1. Visit [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens).
2. Create a token granting **repo** and **gist** permissions.
3. Paste the token into the relevant form in DSPACE and click **Save**.

## Token Storage

Your token is stored in IndexedDB under `gameState.github.token` so you don't need to re-enter it
each time you open the game. Cloud Sync also stores the last-used gist ID at
`gameState.cloudSync.gistId`. You can clear the saved token using the **Clear** button next to the
input field or the **Log out** button in Settings.

## Security Considerations

- The token never leaves your browser except when making authenticated requests to GitHub.
- You can revoke the token at any time from your GitHub settings.
- If you share your device, remember to clear the token to prevent unauthorized submissions.
- User-generated markdown is sanitized with DOMPurify before rendering to prevent XSS.

With a valid token saved, features like quest submission and Cloud Sync will work seamlessly.

## Logging out

If you're using a shared machine, open the **Settings** page and click **Log out** to clear the
saved GitHub token and Cloud Sync gist ID from the device. This removes access to your synced data
until you sign in again.
