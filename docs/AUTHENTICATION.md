# Authentication Flow

DSPACE avoids traditional user accounts. Authentication occurs only when you submit a custom quest to GitHub.

1. Generate a personal access token with the `repo` scope on GitHub.  
2. Enter the token in the quest submission form at `/quests/submit`.  
3. The token is stored in your browser's `localStorage`, so you don’t need to re-enter it.  
4. The token is sent directly to the GitHub API to create a branch and pull request.  
5. Clear the saved token with the **Clear Token** button or remove it in your GitHub settings.

Tokens are never sent to servers other than GitHub. Revoke the token in GitHub when you no longer need it.  

User-generated Markdown is sanitized with DOMPurify before rendering to prevent cross-site scripting (XSS) attacks.
