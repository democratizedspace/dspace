---
title: 'Authentication Flow'
slug: 'authentication'
---

DSPACE uses GitHub authentication only for features that talk directly to GitHub. Most of the game
works offline. Authentication is required when you submit content to the official repository,
sync your save data with **Cloud Sync**, or choose quest options that are gated by GitHub access.

## Where you'll see authentication prompts

Authentication appears in the following places today:

- **Quest submissions** at `/quests/submit` (creates a pull request in the
  `democratizedspace/dspace` repo).
- **Custom content bundle submissions** at `/bundles/submit` (creates a pull request with bundle
  JSON).
- **Cloud Sync** at `/cloudsync` (reads/writes private GitHub gists for backups).
- **Quest options that require GitHub** (options flagged with `requiresGitHub` stay disabled until
  a valid token is saved).
- **Settings → Log out** (clears saved GitHub credentials, Cloud Sync gist ID, and avatar URL from
  this device).

## Personal Access Tokens

To authenticate, generate a GitHub personal access token. The token is used client-side only and
never sent anywhere except directly to GitHub's API.

1. Visit [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens).
2. Create a token with the scopes you need (see below).
3. Paste the token into the relevant form in DSPACE and click **Save**.

### Token scopes by feature

- **Quest submissions** (`/quests/submit`): needs repository access for the DSPACE repo. Classic
  PATs should include **repo**. Fine-grained tokens should grant read/write access to the DSPACE
  repository (contents + pull requests).
- **Bundle submissions** (`/bundles/submit`): same requirements as quest submissions.
- **Cloud Sync** (`/cloudsync`): needs **gist** access (read/write) to create and list private
  gists. You can use a separate gist-only token if you prefer.

If you want a single token for all surfaces, a classic PAT with **repo** + **gist** is sufficient.

## Token Storage

Your token is stored in IndexedDB under `gameState.github.token` so you don't need to re-enter it
each time you open the game. Cloud Sync also stores the selected gist ID at
`gameState.cloudSync.gistId`. You can clear the saved token using the **Clear** button next to the
input field.

## Security Considerations

- The token never leaves your browser except when making authenticated requests to GitHub.
- You can revoke the token at any time from your GitHub settings.
- If you share your device, remember to clear the token to prevent unauthorized submissions.
- User-generated markdown is sanitized with DOMPurify before rendering to prevent XSS.

With a valid token saved, features like quest submission, bundle submission, gated quest options,
and Cloud Sync will work seamlessly.

## Logging out

If you're using a shared machine, open the **Settings** page and click **Log out** to clear the
saved GitHub token, Cloud Sync gist ID, and stored `avatarUrl` from the device. This removes access
to your synced data until you sign in again.
