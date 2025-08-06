# Authentication Flow

DSPACE avoids traditional user accounts. The only time authentication occurs is when you submit a custom quest to GitHub.

1. Generate a personal access token with `repo` scope on GitHub.
2. Enter the token in the Quest Submission form at `/quests/submit`.
3. The token is stored in your browser's `localStorage` so you don't need to re-enter it.
4. The token is sent directly to the GitHub API to create a branch and pull request.
5. You can clear the saved token using the **Clear Token** button or by removing it from your GitHub settings.

Tokens are never sent to any server other than GitHub. Remember to revoke the token from GitHub whenever you no longer need it.
User-generated markdown is sanitized with DOMPurify before rendering to prevent cross-site scripting (XSS).
