# Authentication Flow

DSPACE avoids traditional user accounts. The only time authentication occurs is when you submit a custom quest to GitHub.

1. Generate a personal access token with `repo` scope on GitHub.
2. Enter the token in the Quest Submission form at `/quests/submit`.
3. The token is sent directly to the GitHub API to create a branch and pull request.
4. After the request completes, the form clears the token field so it is not stored in the browser.

Tokens are never saved to localStorage or sent to any server other than GitHub. You can revoke the token at any time from your GitHub settings.
