---
title: 'Authentication Flow'
slug: 'authentication'
---

DSPACE uses GitHub authentication for features that interact with the official repository, such as submitting custom quest pull requests or syncing your save data with **Cloud Sync**.

## Personal Access Tokens

To authenticate, generate a GitHub personal access token with the `repo` and `gist` scopes. The token is used client-side only and never sent anywhere except directly to GitHub's API.

1. Visit [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens).
2. Create a token granting **repo** and **gist** permissions.
3. Paste the token into the relevant form in DSPACE and click **Save**.

## Token Storage

Your token is stored in IndexedDB under `gameState.github.token` so you don't
need to re-enter it each time you open the game. You can clear the saved token
using the **Clear** button next to the input field.

## Security Considerations

-   The token never leaves your browser except when making authenticated requests to GitHub.
-   You can revoke the token at any time from your GitHub settings.
-   If you share your device, remember to clear the token to prevent unauthorized submissions.
-   User-generated markdown is sanitized with DOMPurify before rendering to prevent XSS.

With a valid token saved, features like quest submission and Cloud Sync will work seamlessly.
