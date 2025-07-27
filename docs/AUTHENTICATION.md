# Authentication Flow

DSPACE avoids traditional user accounts. The only time authentication occurs is when you submit a custom quest to GitHub.

1. Generate a personal access token with `repo` scope on GitHub.
2. Enter the token in the Quest Submission form at `/quests/submit`.
3. The token is stored in `localStorage` so you don't need to paste it every time.
4. When submitting a quest, the token is sent directly to the GitHub API to create a branch and pull request. It is never sent anywhere else.
5. Use the **Clear Token** button in the submission form to remove it from `localStorage` when you're done. You can also revoke the token from your GitHub settings at any time.
