---
title: 'Authentication Flow'
slug: 'authentication'
---

DSPACE uses GitHub authentication for features that interact with the official repository or your
personal backups. You only need a token when you choose these features, and you can play without
signing in.

## Where authentication shows up

- **Quest submissions**: the in-game form at `/quests/submit` creates a pull request in the
  official repository.
- **Custom content bundles**: the bundle form at `/bundles/submit` opens a pull request for a
  combined quests/items/processes submission.
- **Cloud Sync**: the `/cloudsync` page reads and writes private GitHub gists for backups.
- **Quest finish requirements**: some quests include `requiresGitHub` options that stay locked
  until a valid token is saved.
- **Log out / clear credentials**: the Settings page includes a log out action that wipes saved
  GitHub tokens and Cloud Sync gist IDs.

## Personal Access Tokens

To authenticate, generate a GitHub personal access token with permissions that match what you're
doing. The token is used client-side only and never sent anywhere except directly to GitHub's API.

1. Visit [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens).
2. For quest submissions or bundles, create a classic PAT with `repo` scope (or a fine-grained
   PAT that can access the `democratizedspace/dspace` repo with **Contents** and
   **Pull requests** read/write permissions).
3. For Cloud Sync, create a PAT with `gist` scope (or a fine-grained PAT with **Gists**
   read/write access).
4. Paste the token into the relevant form in DSPACE and click **Save**.

## Token Storage

Your token is stored in IndexedDB under `gameState.github.token` so you don't need to re-enter it
each time you open the game. Cloud Sync also stores the most recently used gist ID in
`gameState.cloudSync.gistId`. You can clear the saved token using the **Clear** button next to the
input field.

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
